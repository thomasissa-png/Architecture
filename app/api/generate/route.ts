import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decrementCredit, addCredits } from "@/lib/credits";
import { logGeneration, savePass1Cache, getPass1Cache } from "@/lib/db";
import { preprocessIterationComment } from "@/lib/custom-prompt";
import {
  buildIterationFurnitureResponsesPrompt,
  buildIterationFurnitureFluxPrompt,
  FLUX_ITERATION_NEGATIVE_PROMPT,
  MAX_ITERATIONS,
  PASS1_TTL_MS,
} from "@/lib/iteration-prompt";
import { applyRoomTypeOverrides } from "@/lib/room-types";
import { applyOutdoorSubtypeOverrides, OUTDOOR_SUBTYPES } from "@/lib/outdoor-subtypes";
import {
  buildIterationOutdoorFurnitureResponsesPrompt,
  buildIterationOutdoorFurnitureFluxPrompt,
} from "@/lib/iteration-prompt";

// ─── Timeout wrapper for external API calls ─────────────────────────
const API_TIMEOUT_MS = 120_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout: ${label} n'a pas répondu en ${ms / 1000}s`)),
      ms
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// ─── Rate Limiting (in-memory, IP-based) ────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ─── Output Size (preserve input aspect ratio) ──────────────────────
// Maps input dimensions to the closest OpenAI-compatible size.
// OpenAI image_generation supports: 1024x1024, 1536x1024, 1024x1536
function getOutputSize(
  width?: number,
  height?: number
): { openai: string; w: number; h: number } {
  if (!width || !height) {
    return { openai: "1024x1024", w: 1024, h: 1024 };
  }
  const ratio = width / height;
  if (ratio > 1.3) return { openai: "1536x1024", w: 1536, h: 1024 }; // landscape
  if (ratio < 0.77) return { openai: "1024x1536", w: 1024, h: 1536 }; // portrait
  return { openai: "1024x1024", w: 1024, h: 1024 }; // square-ish
}

// ─── Prompt Engineering ──────────────────────────────────────────────
//
// PIPELINE 2 PASSES with SPLIT PROMPTS:
// Pass 1 (surfaces): Uses surfacePrompt — wall color, floor finish, ceiling, fixture ONLY.
// Pass 2 (furniture): Uses furniturePrompt — freestanding objects ONLY.
//
// RULES:
// - NO lighting directives in style prompts (preserve input light)
// - NO curtains/drapes (hallucination risk)
// - NO structural modifications beyond surface finish
// - surfacePrompt: color/finish of walls, floor, ceiling + ceiling fixture
// - furniturePrompt: freestanding objects with precise silhouettes + scale

// ── Shared prompt fragments (constants to avoid duplication) ─────────
const DSLR_LINE = "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle grain ISO 200, natural vignetting. No text or watermarks.";
const CEILING_PRESERVATION = "Preserve ceiling 3D geometry — vaults, beams, ribs keep shape. Refinish ceiling surface: smooth plaster over raw concrete, formwork marks, seams. Beams keep 3D shape but receive clean painted finish.";
const LIGHT_PRESERVATION = "Preserve existing light direction, shadow positions, and relative intensity. Maintain wall color temperature from input. Do not artificially brighten darker areas.";
const CAMERA_PRESERVATION = "Same camera angle, lens distortion, vanishing points, field of view, orientation.";

// ── Pass 1: Surface finishing ────────────────────────────────────────
function buildSurfacesResponsesPrompt(surfacePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: dedicated compact prompt (~100 words)
  if (roomTypeId === "kitchen") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Ceramic or natural stone floor tiles — NOT wood, NOT parquet. Subway tile or smooth splashback behind work area.",
      CEILING_PRESERVATION,
      "For the ceiling light fixture, follow the style description above exactly.",
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring. Keep all fixed wall equipment: radiators, switches, vents in exact position.",
      "Room stays COMPLETELY EMPTY — no furniture, no appliances, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Bathroom: dedicated compact prompt (~100 words)
  if (roomTypeId === "bathroom") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Floor-to-ceiling ceramic tiles in shower zone and behind vanity area. Water-resistant floor — ceramic or stone tiles, matte non-slip. No wood flooring. Recessed IP44 ceiling spotlights.",
      CEILING_PRESERVATION,
      "Remove construction leftovers: dangling cables, junction boxes, exposed wiring. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no fixtures, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // WC: dedicated compact prompt (~90 words)
  if (roomTypeId === "wc") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Waterproof floor — small ceramic tiles or vinyl in neutral tone. Washable matte paint or ceramic tiles on lower half of walls.",
      CEILING_PRESERVATION,
      "Remove construction leftovers. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no fixtures, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Bedroom (adults/children): dedicated compact prompt (~105 words)
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Warm-toned flooring suitable for bare feet. For the ceiling light fixture, follow the style description above exactly.",
      "If the input has ONE accent wall (different color or texture from the other walls), preserve that accent wall as-is — apply the style's wall color to the remaining walls. If ALL walls share the same color, apply the style's wall color to ALL walls uniformly.",
      CEILING_PRESERVATION,
      "Remove construction leftovers: dangling cables, junction boxes. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no furniture, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Laundry: dedicated compact prompt (~90 words)
  if (roomTypeId === "laundry") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Waterproof easy-to-clean floor — white or light grey ceramic tiles matte finish. Walls in washable matte white paint.",
      CEILING_PRESERVATION,
      "Remove construction leftovers. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no appliances, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Cellar: dedicated compact prompt (~90 words)
  if (roomTypeId === "cellar") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Concrete or stone floor kept as-is or with simple sealant. Clean matte white or light grey paint over existing masonry.",
      CEILING_PRESERVATION,
      "Remove construction leftovers. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no shelving, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // Entryway: dedicated compact prompt (~95 words)
  if (roomTypeId === "entryway") {
    return [
      `Edit this photo of a room. Apply this surface finish: ${surfacePrompt}.`,
      "Durable floor finish suitable for an entrance — ceramic tiles, natural stone, or hard-wearing wood.",
      CEILING_PRESERVATION,
      "For the ceiling light fixture, follow the style description above exactly.",
      "Remove construction leftovers. Keep all fixed wall equipment in exact position: radiators, heaters, vents, switches.",
      "Room stays COMPLETELY EMPTY — no furniture, no objects. Same number of windows and doors.",
      `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
      DSLR_LINE,
    ].join(" ");
  }

  // ── FALLBACK: generic builder for living_room, dining_room, office, null ──
  return [
    "Edit this photo of a room.",
    `Apply this surface finish: ${surfacePrompt}.`,
    "Refinish the floor and repaint or replaster the walls. For the ceiling light fixture, follow the style description above exactly.",
    "If the input has ONE accent wall (different color or texture from the other walls), preserve that accent wall as-is — apply the style's wall color to the remaining walls. If ALL walls share the same color, apply the style's wall color to ALL walls uniformly.",
    CEILING_PRESERVATION,
    "Remove all visible construction elements: dangling cables, exposed wiring, junction boxes without covers, cable conduits, and temporary fixtures.",
    "Do not add baseboards or moldings unless clearly present in the input photo.",
    "Preserve all wall-mounted fixed equipment visible in the input: radiators, heaters, vents, thermostats, electrical panels, switches, and outlets must remain in their exact position, size, and appearance.",
    "Keep the room COMPLETELY EMPTY — no furniture, no rugs, no textiles, no decoration, no objects.",
    "The number of windows and doors must be EXACTLY the same as in the input. If there are zero windows, there must be zero windows in the output.",
    `${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}`,
    DSLR_LINE,
  ].join(" ");
}

function buildSurfacesFluxPrompt(surfacePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: compact Flux surface prompt (~70 words)
  if (roomTypeId === "kitchen") {
    return [
      `${surfacePrompt}, finished empty kitchen interior.`,
      "Ceramic or stone floor tiles — no wood, no parquet. Subway tile or smooth splashback behind work area.",
      "Preserve ceiling 3D geometry — vaults, beams, ribs keep shape. Ceiling light per style.",
      "Remove construction leftovers. Keep wall-mounted equipment in place: radiators, heaters, vents, switches.",
      "Empty room — no furniture, no appliances. Same windows and doors.",
      "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.",
    ].join(" ");
  }

  // Bathroom: compact Flux surface prompt (~70 words)
  if (roomTypeId === "bathroom") {
    return [
      `${surfacePrompt}, finished empty bathroom interior.`,
      "Floor-to-ceiling ceramic tiles in shower zone and behind vanity. Water-resistant stone or ceramic floor, matte non-slip. No wood. Recessed IP44 ceiling spotlights.",
      "Preserve ceiling 3D geometry. Remove construction leftovers. Keep wall equipment in place: radiators, heaters, vents, switches.",
      "Empty room — no fixtures, no objects. Same windows and doors.",
      "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.",
    ].join(" ");
  }

  // WC: compact Flux surface prompt (~60 words)
  if (roomTypeId === "wc") {
    return [
      `${surfacePrompt}, finished empty WC interior.`,
      "Small ceramic tiles or vinyl floor, neutral tone. Washable matte paint or ceramic tiles on lower walls.",
      "Remove construction leftovers. Keep wall equipment in place: radiators, heaters, vents, switches.",
      "Empty room — no fixtures, no objects. Same windows and doors.",
      "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.",
    ].join(" ");
  }

  // Bedroom: compact Flux surface prompt (~70 words)
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `${surfacePrompt}, finished empty bedroom interior.`,
      "Warm-toned flooring for bare feet. Ceiling light per style.",
      "If ONE accent wall differs in color or texture, preserve it as-is — restyle plain walls only. If ALL walls share the same color, restyle ALL walls uniformly.",
      "Preserve ceiling 3D geometry. Remove construction leftovers. Keep wall equipment in place: radiators, heaters, vents, switches.",
      "Empty room — no furniture, no objects. Same windows and doors.",
      "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.",
    ].join(" ");
  }

  // Laundry: compact Flux surface prompt (~60 words)
  if (roomTypeId === "laundry") {
    return [
      `${surfacePrompt}, finished empty laundry room.`,
      "White or light grey ceramic floor tiles, matte finish. Washable matte white walls.",
      "Preserve ceiling 3D geometry — vaults, beams, ribs keep shape. Clean plaster finish over raw concrete.",
      "Remove construction leftovers. Keep wall equipment in place: radiators, heaters, vents, switches.",
      "Empty room — no appliances, no objects. Same windows and doors.",
      "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.",
    ].join(" ");
  }

  // Cellar: compact Flux surface prompt (~60 words)
  if (roomTypeId === "cellar") {
    return [
      `${surfacePrompt}, finished empty cellar.`,
      "Concrete or stone floor as-is or with sealant. Clean matte white or grey paint over masonry.",
      "Preserve ceiling 3D geometry — vaults, beams, ribs keep shape. Clean plaster finish over raw concrete.",
      "Remove construction leftovers. Keep wall equipment in place: radiators, heaters, vents, switches.",
      "Empty room — no shelving, no objects. Same windows and doors.",
      "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.",
    ].join(" ");
  }

  // Entryway: compact Flux surface prompt (~65 words)
  if (roomTypeId === "entryway") {
    return [
      `${surfacePrompt}, finished empty entryway interior.`,
      "Durable floor — ceramic tiles, stone, or hard-wearing wood. Ceiling light per style.",
      "Remove construction leftovers. Keep wall equipment in place: radiators, heaters, vents, switches.",
      "Empty room — no furniture, no objects. Same windows and doors.",
      "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.",
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, dining_room, office, null ──
  return [
    `${surfacePrompt}, finished empty room interior.`,
    "Refinished floor, repainted walls. Ceiling light per style description.",
    "If ONE accent wall differs in color or texture, preserve it as-is — restyle plain walls only. If ALL walls share the same color, restyle ALL walls uniformly.",
    "Preserve ceiling 3D geometry — vaults, beams, ribs, arches keep their shape and volume. Refinish ceiling surface: smooth plaster and paint over raw concrete, formwork marks, plasterboard seams. Beams keep 3D shape but receive clean painted finish. Ceiling between structural elements must look fully finished and smooth.",
    "Remove all construction leftovers: dangling cables, exposed wiring, junction boxes, cable conduits, temporary fixtures.",
    "Do not add baseboards or moldings unless clearly present in the input photo.",
    "Keep all wall-mounted equipment: radiators, heaters, vents, thermostats, switches, outlets in exact position.",
    "Completely empty room — no furniture, no rugs, no textiles, no objects.",
    "Exact same number of windows and doors as the original. Same room geometry, same proportions.",
    "Preserve existing light direction, shadow patterns, wall color temperature, light falloff, and camera angle.",
    "Photo-realistic interior photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ].join(" ");
}

// ── Pass 2: Furniture placement ──────────────────────────────────────

// Shared compact fragments for pass 2
const STRUCTURE_LOCKED = "Room structure is LOCKED: walls, floor, ceiling, windows visually identical to input. Shadows from furniture are natural. No new openings.";
const EQUIPMENT_PRESERVATION = "Keep all wall-mounted equipment visible (radiators, vents, switches, outlets). Do not place furniture in front of radiators.";
const CAMERA_AND_PHOTO = `${CAMERA_PRESERVATION} DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle grain ISO 200, natural vignetting. No text or watermarks.`;

function buildFurnitureResponsesPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
  // Kitchen: compact dedicated prompt (~95 words) — built-ins allowed, no depth distribution
  if (roomTypeId === "kitchen") {
    return [
      `Add the following kitchen elements to this photo of a finished room: ${furniturePrompt}.`,
      "Built-in cabinetry and countertops against walls, island or peninsula with stools if space allows. Pendant light above work area.",
      "Place all elements with correct perspective and scale on the existing floor. Cast realistic shadows matching existing light.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Bathroom: compact dedicated prompt (~90 words) — wall-mounted vanity allowed, no depth distribution
  if (roomTypeId === "bathroom") {
    return [
      `Add the following bathroom fixtures and accessories to this photo of a finished room: ${furniturePrompt}.`,
      "Wall-mounted vanity and mirror expected. Other items (stool, basket, plant) freestanding.",
      "Place all elements with correct perspective and scale. Cast realistic shadows matching existing light.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // WC: compact dedicated prompt (~80 words) — very small space, minimal items
  if (roomTypeId === "wc") {
    return [
      `Add the following WC fixtures to this photo of a finished room: ${furniturePrompt}.`,
      "Very small space — minimal items only. Wall-hung or floor toilet, compact hand basin with mirror above.",
      "Place all elements with correct perspective and scale. Cast realistic shadows matching existing light.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Bedroom (adults/children): compact dedicated prompt (~100 words) — no depth distribution, no double-height scaling
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `Add the following bedroom furniture to this photo of a finished room: ${furniturePrompt}.`,
      "Freestanding furniture only — bed, nightstands, rug beside bed, wardrobe or dresser as background anchor. No wall-mounted art, no built-in shelving, no curtains.",
      "Place all objects naturally on the floor with correct perspective and scale. Cast realistic shadows matching existing light.",
      "Calm atmosphere — respect furniture density implied by the style.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "The output must have the exact same number of windows as the input.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Entryway: compact dedicated prompt (~85 words) — small space, minimal items
  if (roomTypeId === "entryway") {
    return [
      `Add the following entryway furniture to this photo of a finished room: ${furniturePrompt}.`,
      "Small space — do not overcrowd. Freestanding items only: console, mirror propped on console, coat rack, small bench, runner rug. No wall-mounted art, no curtains.",
      "Place all objects with correct perspective and scale. Cast realistic shadows matching existing light.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Laundry: compact dedicated prompt (~85 words) — functional, no decoration
  if (roomTypeId === "laundry") {
    return [
      `Add the following laundry equipment to this photo of a finished room: ${furniturePrompt}.`,
      "Functional layout — washing machine, storage cabinet, drying rack, laundry basket. No decorative objects, no luxury items.",
      "Place all elements with correct perspective and scale. Cast realistic shadows matching existing light.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Cellar: compact dedicated prompt (~85 words) — storage, no luxury
  if (roomTypeId === "cellar") {
    return [
      `Add the following cellar furnishing to this photo of a finished room: ${furniturePrompt}.`,
      "Functional storage — shelving unit, storage boxes, utility light. Wine rack if space allows. No luxury furniture, no decorative objects.",
      "Place all elements with correct perspective and scale. Cast realistic shadows matching existing light.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // Dining room: compact dedicated prompt (~110 words) — depth distribution relevant
  if (roomTypeId === "dining_room") {
    return [
      `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
      "Center the dining table with chairs. If room is deep or has multiple zones, add a sideboard or buffet as background anchor.",
      "Place all objects naturally on the floor with correct perspective and scale. Cast realistic shadows matching existing light — soft for diffused, hard for direct sunlight.",
      "Respect furniture density implied by the style. If room appears small, reduce accent pieces.",
      "Freestanding objects only. Do not add any wall-mounted art, framed paintings, prints, mirrors, or wall-mounted decorations. No built-in shelving, no curtains.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      CAMERA_AND_PHOTO,
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, office, null ── (full directives)
  return [
    `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
    "Distribute furniture across the FULL DEPTH and WIDTH of the room. If the room is deep or has multiple zones, place a primary group in the foreground AND a secondary group further back. If the room is also wide, add a lateral anchor on the opposite side.",
    "Place all objects naturally on the floor. Every piece must have correct perspective, scale, and cast realistic shadows matching the existing light. Match shadow hardness to lighting type.",
    "If the ceiling appears very high (>3m) or room is very large, scale up furniture proportionally.",
    "Respect furniture density implied by the style. If minimalist, leave large empty floor areas. If room appears small, reduce accent pieces.",
    "Freestanding objects only. Do not add any wall-mounted art, framed paintings, prints, mirrors, or wall-mounted decorations of any kind. No built-in shelving, no curtains.",
    STRUCTURE_LOCKED,
    EQUIPMENT_PRESERVATION,
    "If the input has zero windows, the output must have zero windows.",
    CAMERA_AND_PHOTO,
  ].join(" ");
}

function buildFurnitureFluxPrompt(furniturePrompt: string, roomTypeId?: string | null): string {
  const FLUX_STRUCTURE = "Walls, floor, ceiling identical to input. Shadows from furniture natural. No new openings.";
  const FLUX_EQUIPMENT = "Keep radiators, vents, switches visible.";
  const FLUX_PHOTO = "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.";

  // Kitchen: compact Flux furniture (~60 words)
  if (roomTypeId === "kitchen") {
    return [
      `${furniturePrompt}, placed in this finished kitchen interior.`,
      "Built-in cabinetry against walls, island with stools if space allows. Pendant above work area.",
      "Correct perspective and scale. Realistic shadows matching existing light.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      "No curtains.",
      FLUX_PHOTO,
    ].join(" ");
  }

  // Bathroom: compact Flux furniture (~55 words)
  if (roomTypeId === "bathroom") {
    return [
      `${furniturePrompt}, placed in this finished bathroom interior.`,
      "Wall-mounted vanity and mirror expected. Other items freestanding.",
      "Correct perspective and scale. Realistic shadows matching existing light.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      "No curtains.",
      FLUX_PHOTO,
    ].join(" ");
  }

  // WC: compact Flux furniture (~50 words)
  if (roomTypeId === "wc") {
    return [
      `${furniturePrompt}, placed in this finished small WC room.`,
      "Minimal items — toilet, hand basin, mirror. Very small space, do not overcrowd.",
      "Correct perspective and scale. Realistic shadows.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      FLUX_PHOTO,
    ].join(" ");
  }

  // Bedroom: compact Flux furniture (~60 words)
  if (roomTypeId === "bedroom_adults" || roomTypeId === "bedroom_children") {
    return [
      `${furniturePrompt}, placed in this finished bedroom interior.`,
      "Freestanding only — bed, nightstands, rug, wardrobe as background anchor. No wall art, no curtains.",
      "Correct perspective and scale. Realistic shadows matching existing light. Calm atmosphere.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      "Same number of windows.",
      FLUX_PHOTO,
    ].join(" ");
  }

  // Entryway: compact Flux furniture (~55 words)
  if (roomTypeId === "entryway") {
    return [
      `${furniturePrompt}, placed in this finished entryway.`,
      "Small space — do not overcrowd. Console, mirror on console, coat rack, bench, runner rug. Freestanding only, no curtains.",
      "Correct perspective and scale. Realistic shadows.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      FLUX_PHOTO,
    ].join(" ");
  }

  // Laundry: compact Flux furniture (~50 words)
  if (roomTypeId === "laundry") {
    return [
      `${furniturePrompt}, placed in this finished laundry room.`,
      "Functional — washing machine, storage, drying rack. No decorative items.",
      "Correct perspective and scale. Realistic shadows.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      FLUX_PHOTO,
    ].join(" ");
  }

  // Cellar: compact Flux furniture (~50 words)
  if (roomTypeId === "cellar") {
    return [
      `${furniturePrompt}, placed in this finished cellar.`,
      "Functional storage — shelving, boxes, utility light. No luxury furniture.",
      "Correct perspective and scale. Realistic shadows.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      FLUX_PHOTO,
    ].join(" ");
  }

  // Dining room: compact Flux furniture (~65 words)
  if (roomTypeId === "dining_room") {
    return [
      `${furniturePrompt}, placed in this finished dining room interior.`,
      "Center table with chairs. Sideboard as background anchor if room is deep. Freestanding only, no wall art, no framed paintings, no curtains.",
      "Correct perspective and scale. Realistic shadows matching existing light.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      FLUX_PHOTO,
    ].join(" ");
  }

  // ── FALLBACK: generic for living_room, office, null ──
  return [
    `${furniturePrompt}, placed naturally across the full depth of this finished room interior.`,
    "Distribute furniture in depth and width: primary group in foreground, secondary group in the back if space allows, lateral anchor on the opposite side if room is wide.",
    "Shadow hardness matches lighting: soft for diffused, hard for direct sunlight. Scale furniture up if ceiling is very high.",
    "Freestanding only. No wall-mounted art, no framed paintings, no prints, no mirrors, no built-in shelving, no curtains.",
    "Walls, floor, ceiling identical to input. Shadows from furniture natural. No new openings.",
    "Keep radiators, vents, switches visible. Do not block radiators.",
    "Same camera angle, same lighting. Photo-realistic, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain.",
  ].join(" ");
}

// Flux Depth Pro negative prompt — prevents common artifacts (indoor)
const FLUX_NEGATIVE_PROMPT =
  "distorted perspective, fisheye, stretched walls, shallow depth of field, bokeh, cartoon, illustration, 3D render, CGI, plastic, watermark, text, blurry, overexposed windows, extra windows, extra doors, floating furniture, dangling cables, junction box, unfinished floor, overly clean, flat lighting, color grading, warm color shift, cool color shift";

// Outdoor negative prompt — prevents indoor artifacts in outdoor generations
const OUTDOOR_NEGATIVE_PROMPT =
  "indoor sofa, area rug, floor lamp, ceiling light, chandelier, curtains, drapes, wallpaper, baseboard, interior door, radiator, electrical outlet, kitchen appliances, ceiling, roof, indoor plant pot on parquet, distorted perspective, fisheye, stretched walls, cartoon, illustration, 3D render, CGI, watermark, text, blurry, color grading, warm color shift, cool color shift, golden hour filter";

// ── Outdoor Pass 1: Ground surface finishing (no ceiling, no luminaire) ──
function buildOutdoorSurfacesResponsesPrompt(
  surfacePrompt: string,
  subtypeOverride: string
): string {
  return [
    "Edit this outdoor photo. Keep exact same camera angle, lens distortion, vanishing points.",
    "Open-air space — no ceiling, sky preserved as-is. Preserve highlights — do not recover blown-out sky.",
    `Apply this ground surface finish: ${surfacePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Preserve all fixed ground elements: metal access covers, drain grates, manholes, utility plates. Apply the new ground material AROUND these elements, not over them.",
    "Preserve all existing guard rails, exterior walls, facades, gates and fences. Do not add or remove any vertical structure.",
    "Keep the existing wall color and texture — do not warm, smooth, or repaint walls unless the surface prompt explicitly names a wall finish.",
    "Glass blocks and skylights keep their translucency — light passes through them in the output.",
    "Preserve existing vegetation in the background. Only modify ground surface in the foreground zone.",
    "Preserve the exact lighting conditions from the input — same shadow hardness, same direction, same color temperature.",
    "No furniture in this pass — EMPTY outdoor space with finished ground only.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting.",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildOutdoorSurfacesFluxPrompt(
  surfacePrompt: string,
  subtypeOverride: string
): string {
  return [
    `${surfacePrompt}, finished empty outdoor space.`,
    "Open-air — no ceiling, sky preserved as-is. Preserve blown-out sky highlights.",
    subtypeOverride ? subtypeOverride : "",
    "Preserve fixed ground elements (metal covers, drain grates, manholes) — apply new ground material around them.",
    "Preserve all guard rails, exterior walls, facades, gates, fences. No new vertical structures.",
    "Keep existing wall color and texture — do not warm, smooth, or repaint walls.",
    "Glass blocks and skylights keep their translucency.",
    "Preserve background vegetation. Only modify foreground ground surface.",
    "Preserve exact lighting conditions from input — same shadow hardness, direction, color temperature.",
    "Empty outdoor space — no furniture, no rugs, no objects.",
    "Same camera angle, same proportions.",
    "Photo-realistic outdoor photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Outdoor Pass 2: Outdoor furniture placement ─────────────────────────
function buildOutdoorFurnitureResponsesPrompt(
  furniturePrompt: string,
  subtypeOverride: string
): string {
  return [
    `Add outdoor furniture and decoration to this photo of a finished outdoor space: ${furniturePrompt}.`,
    subtypeOverride ? subtypeOverride : "",
    "Distribute furniture naturally across the available floor space. If space is large, create a primary seating group and a secondary accent further back.",
    "Do not place opaque structures (screens, shelving, A-frames) directly in front of full-height windows or glass doors.",
    "If the space has exposed overhead structure (beams, pergola, rafters), consider hanging one trailing plant or lantern from it to activate the vertical dimension — only if clearance allows.",
    "Ground surfaces are LOCKED — same material, color, texture. Guard rails, walls, facades unchanged.",
    "Every piece must cast realistic shadows consistent with the existing natural light direction.",
    "Preserve the exact lighting conditions from the input — same shadow hardness, same direction, same color temperature.",
    "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.",
    "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting. Photo-realistic outdoor photograph. No text, watermarks, or logos.",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildOutdoorFurnitureFluxPrompt(
  furniturePrompt: string,
  subtypeOverride: string
): string {
  return [
    `${furniturePrompt}, placed naturally across the available floor space of this finished outdoor area.`,
    subtypeOverride ? subtypeOverride : "",
    "Primary seating group in foreground, secondary accent further back if space allows.",
    "No opaque structures (screens, shelving, A-frames) in front of full-height windows or glass doors.",
    "If exposed overhead structure (beams, pergola), consider one hanging plant or lantern if clearance allows.",
    "Ground surfaces LOCKED — same material, color, texture. Guard rails, walls, facades unchanged.",
    "Every piece casts realistic shadows consistent with existing natural light.",
    "Preserve exact lighting from input — same shadow hardness, direction, color temperature.",
    "Same camera angle, same proportions.",
    "Photo-realistic outdoor photograph, DSLR full-frame 16-35mm f/8, deep DOF, sharp focus, subtle film grain.",
  ]
    .filter(Boolean)
    .join(" ");
}

// ─── OpenAI Responses API (PRIMARY) ─────────────────────────────────
async function tryOpenAIResponses(
  imageBase64: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  size: string,
  roomTypeId?: string | null,
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string }
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let prompt: string;
  if (outdoor?.isOutdoor) {
    prompt =
      pass === 1
        ? buildOutdoorSurfacesResponsesPrompt(surfacePrompt, outdoor.subtypeSurfaceOverride ?? "")
        : buildOutdoorFurnitureResponsesPrompt(furniturePrompt, outdoor.subtypeFurnitureOverride ?? "");
  } else {
    prompt =
      pass === 1
        ? buildSurfacesResponsesPrompt(surfacePrompt, roomTypeId)
        : buildFurnitureResponsesPrompt(furniturePrompt, roomTypeId);
  }

  const response = await withTimeout(
    openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "high",
            },
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
      tools: [
        {
          type: "image_generation",
          input_fidelity: "high",
          size: size as "1024x1024" | "1536x1024" | "1024x1536",
        },
      ],
    }),
    API_TIMEOUT_MS,
    "OpenAI Responses API"
  );

  const imageOutput = response.output.find(
    (o: { type: string }) => o.type === "image_generation_call"
  );

  if (!imageOutput || !("result" in imageOutput)) {
    throw new Error("No image generated by OpenAI Responses API");
  }

  const resultB64 = (imageOutput as { result: string }).result;
  if (!resultB64) {
    throw new Error("Empty image result from OpenAI Responses API");
  }

  return {
    image: `data:image/png;base64,${resultB64}`,
    model: `OpenAI GPT-4.1 (pass ${pass})`,
  };
}

// ─── Replicate Fallback (Flux Depth Pro) ─────────────────────────────
async function tryFluxDepth(
  imageBase64: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  width: number,
  height: number,
  additionalNegative: string = "",
  roomTypeId?: string | null,
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string }
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;
  let prompt: string;
  let negativeBase: string;
  if (outdoor?.isOutdoor) {
    prompt =
      pass === 1
        ? buildOutdoorSurfacesFluxPrompt(surfacePrompt, outdoor.subtypeSurfaceOverride ?? "")
        : buildOutdoorFurnitureFluxPrompt(furniturePrompt, outdoor.subtypeFurnitureOverride ?? "");
    negativeBase = OUTDOOR_NEGATIVE_PROMPT;
  } else {
    prompt =
      pass === 1
        ? buildSurfacesFluxPrompt(surfacePrompt, roomTypeId)
        : buildFurnitureFluxPrompt(furniturePrompt, roomTypeId);
    negativeBase = FLUX_NEGATIVE_PROMPT;
  }

  // Pass 1 (surfaces): lower guidance to stay closer to input geometry
  // Pass 2 (furniture): slightly higher guidance to ensure furniture appears
  const guidance = pass === 1 ? 12 : 15;

  const output = await withTimeout(
    replicate.run(
      "black-forest-labs/flux-depth-pro" as `${string}/${string}`,
      {
        input: {
          prompt,
          negative_prompt: additionalNegative
            ? `${negativeBase}, ${additionalNegative}`
            : negativeBase,
          control_image: dataUri,
          width,
          height,
          steps: 25,
          guidance,
          output_format: "png",
        },
      }
    ),
    API_TIMEOUT_MS,
    "Flux Depth Pro"
  );

  let imageUrl: string;
  if (typeof output === "string") {
    imageUrl = output;
  } else if (output && typeof output === "object" && "url" in output) {
    imageUrl = (output as { url: () => string }).url();
  } else if (Array.isArray(output) && output.length > 0) {
    imageUrl = typeof output[0] === "string" ? output[0] : String(output[0]);
  } else {
    throw new Error("Unexpected output format from Flux Depth Pro");
  }

  const imageResponse = await withTimeout(fetch(imageUrl), 30_000, "Flux image download");
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    image: `data:image/png;base64,${base64}`,
    model: `Flux Depth Pro (pass ${pass})`,
  };
}

// ─── Iteration-specific generation (pre-built prompt) ────────────────
async function tryOpenAIResponsesWithPrompt(
  imageBase64: string,
  prompt: string,
  size: string
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await withTimeout(
    openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "high",
            },
            { type: "input_text", text: prompt },
          ],
        },
      ],
      tools: [
        {
          type: "image_generation",
          input_fidelity: "high",
          size: size as "1024x1024" | "1536x1024" | "1024x1536",
        },
      ],
    }),
    API_TIMEOUT_MS,
    "OpenAI Responses API"
  );

  const imageOutput = response.output.find(
    (o: { type: string }) => o.type === "image_generation_call"
  );

  if (!imageOutput || !("result" in imageOutput)) {
    throw new Error("No image generated by OpenAI Responses API (iteration)");
  }

  const resultB64 = (imageOutput as { result: string }).result;
  if (!resultB64) {
    throw new Error("Empty image result from OpenAI Responses API (iteration)");
  }

  return {
    image: `data:image/png;base64,${resultB64}`,
    model: "OpenAI GPT-4.1 (iteration)",
  };
}

async function tryFluxDepthWithPrompt(
  imageBase64: string,
  prompt: string,
  width: number,
  height: number
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/jpeg;base64,${imageBase64}`;

  const output = await withTimeout(
    replicate.run(
      "black-forest-labs/flux-depth-pro" as `${string}/${string}`,
      {
        input: {
          prompt,
          negative_prompt: FLUX_ITERATION_NEGATIVE_PROMPT,
          control_image: dataUri,
          width,
          height,
          steps: 25,
          guidance: 15,
          output_format: "png",
        },
      }
    ),
    API_TIMEOUT_MS,
    "Flux Depth Pro"
  );

  let imageUrl: string;
  if (typeof output === "string") {
    imageUrl = output;
  } else if (output && typeof output === "object" && "url" in output) {
    imageUrl = (output as { url: () => string }).url();
  } else if (Array.isArray(output) && output.length > 0) {
    imageUrl = typeof output[0] === "string" ? output[0] : String(output[0]);
  } else {
    throw new Error("Unexpected output format from Flux Depth Pro (iteration)");
  }

  const imageResponse = await withTimeout(fetch(imageUrl), 30_000, "Flux image download");
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    image: `data:image/png;base64,${base64}`,
    model: "Flux Depth Pro (iteration)",
  };
}

async function generateIterationPass(
  base64Image: string,
  responsesPrompt: string,
  fluxPrompt: string,
  outputSize: { openai: string; w: number; h: number }
): Promise<{ image: string; model: string }> {
  let openaiError: Error | null = null;
  let replicateError: Error | null = null;

  if (process.env.OPENAI_API_KEY) {
    try {
      return await tryOpenAIResponsesWithPrompt(base64Image, responsesPrompt, outputSize.openai);
    } catch (err) {
      openaiError = err instanceof Error ? err : new Error(String(err));
      console.error("OpenAI iteration failed:", openaiError.message);
    }
  }

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      return await tryFluxDepthWithPrompt(base64Image, fluxPrompt, outputSize.w, outputSize.h);
    } catch (err) {
      replicateError = err instanceof Error ? err : new Error(String(err));
      console.error("Flux Depth iteration failed:", replicateError.message);
    }
  }

  if (!process.env.OPENAI_API_KEY && !process.env.REPLICATE_API_TOKEN) {
    throw new Error("Aucune clé API configurée.");
  }

  const details: string[] = [];
  if (openaiError) details.push(`OpenAI : ${openaiError.message}`);
  if (replicateError) details.push(`Replicate : ${replicateError.message}`);
  throw new Error(`Échec itération. ${details.join(" | ")}`);
}

// ─── Generate one pass with fallback ─────────────────────────────────
async function generatePass(
  base64Image: string,
  surfacePrompt: string,
  furniturePrompt: string,
  pass: 1 | 2,
  outputSize: { openai: string; w: number; h: number },
  additionalNegative: string = "",
  roomTypeId?: string | null,
  outdoor?: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string }
): Promise<{ image: string; model: string }> {
  let openaiError: Error | null = null;
  let replicateError: Error | null = null;

  if (process.env.OPENAI_API_KEY) {
    try {
      return await tryOpenAIResponses(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.openai, roomTypeId, outdoor);
    } catch (err) {
      openaiError = err instanceof Error ? err : new Error(String(err));
      console.error(`OpenAI pass ${pass} failed:`, openaiError.message);
    }
  }

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      return await tryFluxDepth(base64Image, surfacePrompt, furniturePrompt, pass, outputSize.w, outputSize.h, additionalNegative, roomTypeId, outdoor);
    } catch (err) {
      replicateError = err instanceof Error ? err : new Error(String(err));
      console.error(`Flux Depth pass ${pass} failed:`, replicateError.message);
    }
  }

  if (!process.env.OPENAI_API_KEY && !process.env.REPLICATE_API_TOKEN) {
    throw new Error("Aucune clé API configurée.");
  }

  const details: string[] = [];
  if (openaiError) details.push(`OpenAI : ${openaiError.message}`);
  if (replicateError) details.push(`Replicate : ${replicateError.message}`);
  throw new Error(`Échec passe ${pass}. ${details.join(" | ")}`);
}

// ─── API Route Handler ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter une minute avant de réessayer." },
      { status: 429 }
    );
  }

  // Auth + credit check — authentication required for all generations
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise pour générer. Connectez-vous pour profiter de vos 3 générations gratuites." },
      { status: 401 }
    );
  }

  // Optimistic decrement — reserve the credit BEFORE generation to prevent race conditions
  const decremented = await decrementCredit(session.user.id);
  if (!decremented) {
    return NextResponse.json(
      { error: "Crédits insuffisants. Rechargez un pack pour continuer." },
      { status: 402 }
    );
  }
  let creditRefunded = false;

  let styleId = "unknown";

  try {
    const body = await request.json();
    const {
      image,
      surfacePrompt,
      furniturePrompt,
      styleId: bodyStyleId = "custom",
      withFurniture = true,
      width,
      height,
      // F1 iteration params
      pass1_key: pass1Key,
      iterationComment,
      previousModifications = [],
      sessionId,
      // F2 room type
      roomType = null,
      // F3 outdoor
      isOutdoor = false,
      outdoorSubtype = null,
    } = body as {
      image?: string;
      surfacePrompt?: string;
      furniturePrompt?: string;
      styleId?: string;
      withFurniture?: boolean;
      width?: number;
      height?: number;
      pass1_key?: string;
      iterationComment?: string;
      previousModifications?: string[];
      sessionId?: string;
      roomType?: string | null;
      isOutdoor?: boolean;
      outdoorSubtype?: string | null;
    };

    styleId = bodyStyleId;

    // ── F1 Iteration flow: re-pass 2 only ────────────────────────────
    if (pass1Key) {
      if (!iterationComment || !iterationComment.trim()) {
        return NextResponse.json(
          { error: "Le commentaire d'itération est requis." },
          { status: 400 }
        );
      }

      // Load pass 1 from Object Storage cache
      const cached = await getPass1Cache(pass1Key);
      if (!cached) {
        return NextResponse.json(
          { error: "Passe 1 introuvable. Veuillez regénérer depuis l'image originale." },
          { status: 404 }
        );
      }

      // Check TTL (24h)
      const age = Date.now() - cached.meta.createdAt;
      if (age > PASS1_TTL_MS) {
        return NextResponse.json(
          { error: "Les surfaces de cette génération ont expiré (>24h). Regénérez depuis l'image originale." },
          { status: 410 }
        );
      }

      // Check max iterations
      if (previousModifications.length >= MAX_ITERATIONS) {
        return NextResponse.json(
          { error: `Nombre maximum d'itérations atteint (${MAX_ITERATIONS}).` },
          { status: 403 }
        );
      }

      const outputSize = getOutputSize(cached.meta.width, cached.meta.height);
      const originalFurniturePrompt = cached.meta.furniturePrompt;

      // Pre-process the iteration comment via GPT-4.1-mini
      console.log("Pre-processing iteration comment...");
      const preprocessResult = await preprocessIterationComment(
        iterationComment.trim(),
        cached.meta.styleId,
        originalFurniturePrompt
      );

      // Build all modifications: previous + current enriched
      const allModifications = [...previousModifications, preprocessResult.enrichedComment];

      // Build iteration prompts — use outdoor builders if the original generation was outdoor
      const iterMeta = {
        width: cached.meta.width,
        height: cached.meta.height,
        roomType: cached.meta.roomType,
        isOutdoor: cached.meta.isOutdoor,
      };

      let responsesPrompt: string;
      let fluxPrompt: string;

      if (cached.meta.isOutdoor) {
        responsesPrompt = buildIterationOutdoorFurnitureResponsesPrompt(
          originalFurniturePrompt,
          allModifications,
        );
        fluxPrompt = buildIterationOutdoorFurnitureFluxPrompt(
          originalFurniturePrompt,
          allModifications,
        );
      } else {
        responsesPrompt = buildIterationFurnitureResponsesPrompt(
          originalFurniturePrompt,
          allModifications,
          iterMeta,
        );
        fluxPrompt = buildIterationFurnitureFluxPrompt(
          originalFurniturePrompt,
          allModifications,
          iterMeta,
        );
      }

      const t0 = Date.now();
      console.log(`Starting iteration pass 2... Output size: ${outputSize.openai}`);
      const result = await generateIterationPass(cached.imageBase64, responsesPrompt, fluxPrompt, outputSize);
      const t1 = Date.now();

      const outputBase64 = result.image.replace(/^data:image\/[\w+]+;base64,/, "");
      const iterationNumber = previousModifications.length + 1;

      // Save iteration result to Object Storage
      const response = NextResponse.json({
        image: result.image,
        model: result.model,
        iterationNumber,
        warnings: preprocessResult.warnings,
        enrichedComment: preprocessResult.enrichedComment,
      });

      // Fire-and-forget: log + save iteration image
      logGeneration({
        ip,
        styleId: cached.meta.styleId,
        surfacePrompt: cached.meta.surfacePrompt,
        furniturePrompt: originalFurniturePrompt,
        withFurniture: true,
        inputWidth: cached.meta.width,
        inputHeight: cached.meta.height,
        modelUsed: result.model,
        pass2Model: result.model,
        durationMs: t1 - t0,
        pass2DurationMs: t1 - t0,
        success: true,
        builtPromptPass2: responsesPrompt,
        outputBase64,
        // Iteration-specific fields
        isIteration: true,
        iterationNumber,
        sessionId: sessionId ?? undefined,
        userCommentRaw: iterationComment.trim(),
        userCommentEnriched: preprocessResult.enrichedComment,
        pass1CacheKey: pass1Key,
        roomType: cached.meta.roomType,
        isOutdoor: cached.meta.isOutdoor || undefined,
        outdoorSubtype: cached.meta.outdoorSubtype ?? undefined,
      }).catch((err) => console.error("DB log (iteration) failed:", err));

      // Credit was decremented optimistically at the start — generation succeeded

      return response;
    }

    // ── Standard generation flow (pass 1 + pass 2) ────────────────────
    if (!image || !surfacePrompt || !furniturePrompt) {
      return NextResponse.json(
        { error: "Image et style requis" },
        { status: 400 }
      );
    }

    // Calculate output size matching the input aspect ratio
    const outputSize = getOutputSize(width, height);

    const base64Image = image.replace(/^data:image\/[\w+]+;base64,/, "");

    const estimatedSize = (base64Image.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image dépasse la taille maximale de 10 Mo" },
        { status: 413 }
      );
    }

    // ── Pipeline 2 passes ────────────────────────────────────────────
    // Pass 1: Finish surfaces using surfacePrompt — room stays empty
    // Pass 2 (optional): Add furniture using furniturePrompt — surfaces untouched

    // F3: Apply outdoor subtype overrides OR F2 room type overrides (mutually exclusive)
    let trimmedSurface: string;
    let trimmedFurniture: string;
    let negativeOverride: string;
    let outdoorParam: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string } | undefined;

    if (isOutdoor) {
      // Outdoor mode: apply subtype overrides, no room type
      const { effectiveSurfacePrompt, effectiveFurniturePrompt, subtypeNegativeOverride } =
        applyOutdoorSubtypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), outdoorSubtype ?? null);
      trimmedSurface = effectiveSurfacePrompt;
      trimmedFurniture = effectiveFurniturePrompt;
      negativeOverride = subtypeNegativeOverride;

      // Extract raw subtype overrides for injection into builders
      const sub = outdoorSubtype ? OUTDOOR_SUBTYPES[outdoorSubtype] : null;
      outdoorParam = {
        isOutdoor: true,
        subtypeSurfaceOverride: sub?.subtypeSurfaceOverride ?? "",
        subtypeFurnitureOverride: sub?.subtypeFurnitureOverride ?? "",
      };
    } else {
      // Indoor mode: apply room type overrides
      // Rooms with dedicated builders absorb surface directives directly — skip surface concatenation
      // but still need furniture replacement and negative override from applyRoomTypeOverrides
      // dining_room excluded: it has dedicated FURNITURE builders but no dedicated SURFACE builder,
      // so it needs the standard surface concatenation path (roomSurfaceOverride appended to surfacePrompt).
      const ROOMS_WITH_DEDICATED_BUILDERS = ["kitchen", "bathroom", "wc", "bedroom_adults", "bedroom_children", "entryway", "laundry", "cellar"];
      const hasDedicatedBuilder = roomType && ROOMS_WITH_DEDICATED_BUILDERS.includes(roomType);

      const { effectiveSurfacePrompt, effectiveFurniturePrompt, roomNegativeOverride } =
        applyRoomTypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), roomType ?? null);

      // If dedicated builder exists: use raw style surfacePrompt (builder handles room specifics)
      // Otherwise: use the concatenated effectiveSurfacePrompt (room override appended)
      trimmedSurface = hasDedicatedBuilder ? surfacePrompt.trim() : effectiveSurfacePrompt;
      trimmedFurniture = effectiveFurniturePrompt;
      negativeOverride = roomNegativeOverride;
    }

    const t0 = Date.now();

    console.log(`Starting pass 1 (surfaces)... Output size: ${outputSize.openai}${isOutdoor ? ` outdoor subtype: ${outdoorSubtype}` : roomType ? ` roomType: ${roomType}` : ""}`);
    const pass1 = await generatePass(base64Image, trimmedSurface, trimmedFurniture, 1, outputSize, negativeOverride, isOutdoor ? null : roomType, outdoorParam);
    const t1 = Date.now();

    // Build the final prompts for logging (what the model actually receives)
    const builtPromptPass1 = isOutdoor
      ? buildOutdoorSurfacesResponsesPrompt(trimmedSurface, outdoorParam?.subtypeSurfaceOverride ?? "")
      : buildSurfacesResponsesPrompt(trimmedSurface, roomType);
    const builtPromptPass2 = isOutdoor
      ? buildOutdoorFurnitureResponsesPrompt(trimmedFurniture, outdoorParam?.subtypeFurnitureOverride ?? "")
      : buildFurnitureResponsesPrompt(trimmedFurniture, roomType);

    const pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

    // Cache pass 1 for F1 iterations (fire-and-forget)
    const pass1CacheKey = sessionId
      ? `sessions/${sessionId}/pass1_${Date.now()}.jpg`
      : `sessions/anon_${Date.now()}/pass1.jpg`;

    let pass1Saved = false;
    try {
      await savePass1Cache(pass1CacheKey, pass1Base64, {
        width: width ?? outputSize.w,
        height: height ?? outputSize.h,
        styleId,
        furniturePrompt: trimmedFurniture,
        surfacePrompt: trimmedSurface,
        createdAt: Date.now(),
        roomType: isOutdoor ? null : (roomType ?? null),
        isOutdoor: isOutdoor || undefined,
        outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
      });
      pass1Saved = true;
    } catch (err) {
      console.error("Pass1 cache save failed:", err);
    }

    // If surfaces-only mode, return pass 1 result directly
    if (!withFurniture) {
      const outputBase64 = pass1Base64;
      const response = NextResponse.json({
        image: pass1.image,
        model: `${pass1.model} (surfaces uniquement)`,
        ...(pass1Saved ? { pass1_key: pass1CacheKey } : {}),
      });

      // Fire-and-forget: log to DB + save images to filesystem
      logGeneration({
        ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
        withFurniture: false, inputWidth: width, inputHeight: height,
        modelUsed: `${pass1.model} (surfaces uniquement)`,
        pass1Model: pass1.model, durationMs: t1 - t0, pass1DurationMs: t1 - t0,
        success: true,
        builtPromptPass1,
        inputBase64: base64Image, outputBase64,
        sessionId: sessionId ?? undefined,
        pass1CacheKey,
        roomType: isOutdoor ? undefined : (roomType ?? undefined),
        isOutdoor: isOutdoor || undefined,
        outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
      }).catch((err) => console.error("DB log failed:", err));

      // Credit was decremented optimistically at the start — generation succeeded

      return response;
    }

    console.log("Starting pass 2 (furniture)...");
    const pass2 = await generatePass(pass1Base64, trimmedSurface, trimmedFurniture, 2, outputSize, negativeOverride, isOutdoor ? null : roomType, outdoorParam);
    const t2 = Date.now();

    const outputBase64 = pass2.image.replace(/^data:image\/[\w+]+;base64,/, "");
    const response = NextResponse.json({
      image: pass2.image,
      model: `${pass1.model} → ${pass2.model}`,
      ...(pass1Saved ? { pass1_key: pass1CacheKey } : {}),
    });

    // Fire-and-forget: log to DB + save images to filesystem
    logGeneration({
      ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
      withFurniture: true, inputWidth: width, inputHeight: height,
      modelUsed: `${pass1.model} → ${pass2.model}`,
      pass1Model: pass1.model, pass2Model: pass2.model,
      durationMs: t2 - t0, pass1DurationMs: t1 - t0, pass2DurationMs: t2 - t1,
      success: true,
      builtPromptPass1, builtPromptPass2,
      inputBase64: base64Image, pass1Base64, outputBase64,
      sessionId: sessionId ?? undefined,
      pass1CacheKey,
      roomType: isOutdoor ? undefined : (roomType ?? undefined),
      isOutdoor: isOutdoor || undefined,
      outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
    }).catch((err) => console.error("DB log failed:", err));

    // Credit already decremented optimistically — mark as consumed
    creditRefunded = false;

    return response;
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne du serveur";

    // Refund credit on generation failure (optimistic decrement)
    if (session?.user?.id && !creditRefunded) {
      addCredits(session.user.id, 1).catch((err) =>
        console.error("Credit refund failed:", err)
      );
    }

    // Log failures too
    logGeneration({
      ip, styleId,
      surfacePrompt: "error", furniturePrompt: "error",
      withFurniture: true, success: false, errorMessage: message,
    }).catch((err) => console.error("DB log failed:", err));

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
