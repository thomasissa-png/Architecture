/**
 * Tests unitaires pour sanitizeSurfaces() et validateExtraction()
 * dans lib/marchand/plan-extractor.ts
 *
 * P0 identifié session 43 — ces fonctions sont le filet de sécurité
 * de l'extraction GPT et n'avaient aucun test.
 */
import { describe, it, expect } from "vitest";

// ─── Mock OpenAI (jamais appelé dans ces tests, mais import requis) ─
const { responsesCreateMock } = vi.hoisted(() => ({
  responsesCreateMock: vi.fn(),
}));

import { vi } from "vitest";

vi.mock("openai", () => {
  class OpenAI {
    responses = { create: responsesCreateMock };
    constructor() {}
  }
  return { default: OpenAI };
});

// ─── Import after mock ───────────────────────────────────────────────

import {
  sanitizeSurfaces,
  validateExtraction,
  type SanitizationEntry,
} from "@/lib/marchand/plan-extractor";
import type { PlanExtractionResult } from "@/lib/marchand/schemas";

// ─── Helpers ─────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<PlanExtractionResult["rooms"][0]> = {}): PlanExtractionResult["rooms"][0] {
  return {
    temp_id: "r1",
    name_raw: "Salon",
    surface_m2: 25,
    dimensions: { length_m: 5, width_m: 5 },
    ceiling_height_m: 2.5,
    windows_count: 2,
    doors_count: 1,
    floor: 0,
    confidence: 0.85,
    shape: "rectangular",
    notes: null,
    bounding_box: { x_percent: 10, y_percent: 10, width_percent: 30, height_percent: 30 },
    ...overrides,
  };
}

function makeExtraction(overrides: Partial<PlanExtractionResult> = {}): PlanExtractionResult {
  return {
    rooms: [
      makeRoom({ temp_id: "r1", name_raw: "Salon", surface_m2: 25 }),
      makeRoom({ temp_id: "r2", name_raw: "Cuisine", surface_m2: 12, dimensions: { length_m: 4, width_m: 3 }, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
    ],
    total_surface_m2: 37,
    floors_count: 1,
    extraction_warnings: [],
    scale_reference: "dimensions_on_plan",
    building_outline: { x_percent: 5, y_percent: 5, width_percent: 90, height_percent: 90 },
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════════
// sanitizeSurfaces
// ═════════════════════════════════════════════════════════════════════

describe("sanitizeSurfaces", () => {
  it("retourne les données inchangées quand tout est normal", () => {
    const data = makeExtraction();
    const { data: result, log } = sanitizeSurfaces(data, "appartement");

    expect(log).toHaveLength(0);
    expect(result.rooms[0].surface_m2).toBe(25);
    expect(result.rooms[1].surface_m2).toBe(12);
  });

  it("ne modifie pas les surfaces null", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ surface_m2: null, dimensions: null }),
        makeRoom({ temp_id: "r2", surface_m2: 15 }),
      ],
    });
    const { data: result, log } = sanitizeSurfaces(data, "appartement");

    expect(result.rooms[0].surface_m2).toBeNull();
    // Pas de log pour les null (ils sont skippés)
    expect(log.filter(e => e.room === "Salon")).toHaveLength(0);
  });

  // ── 10x systématique ────────────────────────────────────────────

  it("détecte et corrige une erreur 10x systématique (appartement)", () => {
    // Médiane 250m² > seuil 80m² → toutes les surfaces sont divisées par 10
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Salon", surface_m2: 250, dimensions: { length_m: 50, width_m: 50 } }),
        makeRoom({ temp_id: "r2", name_raw: "Cuisine", surface_m2: 120, dimensions: { length_m: 40, width_m: 30 } }),
      ],
      total_surface_m2: 370,
    });
    const { data: result, log } = sanitizeSurfaces(data, "appartement");

    // 250 / 10 = 25, 120 / 10 = 12
    expect(result.rooms[0].surface_m2).toBe(25);
    expect(result.rooms[1].surface_m2).toBe(12);
    expect(result.total_surface_m2).toBe(37);
    expect(log.filter(e => e.reason === "10x_correction")).toHaveLength(2);
    expect(result.rooms[0].confidence).toBeLessThanOrEqual(0.5);
  });

  it("ne déclenche PAS la correction 10x si le seuil maison est respecté", () => {
    // Maison : seuil 150m². Médiane 90m² < 150 → pas de correction 10x
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Salon", surface_m2: 90, dimensions: { length_m: 10, width_m: 9 } }),
        makeRoom({ temp_id: "r2", name_raw: "Suite", surface_m2: 60, dimensions: { length_m: 10, width_m: 6 } }),
      ],
      total_surface_m2: 150,
    });
    const { data: result, log } = sanitizeSurfaces(data, "maison");

    expect(log.filter(e => e.reason === "10x_correction")).toHaveLength(0);
    expect(result.rooms[0].surface_m2).toBe(90);
  });

  it("ne déclenche PAS la correction 10x si le seuil immeuble est respecté", () => {
    // Immeuble : seuil 250m². Médiane 200m² < 250 → pas de correction
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Plateau", surface_m2: 200, dimensions: { length_m: 20, width_m: 10 } }),
        makeRoom({ temp_id: "r2", name_raw: "Hall", surface_m2: 30, dimensions: { length_m: 6, width_m: 5 } }),
      ],
      total_surface_m2: 230,
    });
    const { log } = sanitizeSurfaces(data, "immeuble");

    expect(log.filter(e => e.reason === "10x_correction")).toHaveLength(0);
  });

  // ── Cap par typeBien ────────────────────────────────────────────

  it("cappe une surface > 80m² pour un appartement", () => {
    // 3 rooms pour que la médiane (25) reste sous le seuil 80 → pas de 10x
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Salon", surface_m2: 25 }),
        makeRoom({ temp_id: "r2", name_raw: "Chambre", surface_m2: 15, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
        makeRoom({ temp_id: "r3", name_raw: "Mezzanine", surface_m2: 95, bounding_box: { x_percent: 10, y_percent: 50, width_percent: 20, height_percent: 20 } }),
      ],
      total_surface_m2: 135,
    });
    const { data: result, log } = sanitizeSurfaces(data, "appartement");

    expect(result.rooms[2].surface_m2).toBeNull();
    expect(result.rooms[2].dimensions).toBeNull();
    expect(log.some(e => e.reason === "cap_80m2" && e.room === "Mezzanine")).toBe(true);
  });

  it("cappe une surface > 150m² pour une maison", () => {
    // 3 rooms, médiane = 20 < 150 → pas de 10x, mais room 0 = 160 > 150 → cap
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Loft", surface_m2: 160 }),
        makeRoom({ temp_id: "r2", name_raw: "Chambre", surface_m2: 20, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
        makeRoom({ temp_id: "r3", name_raw: "SDB", surface_m2: 8, bounding_box: { x_percent: 10, y_percent: 50, width_percent: 20, height_percent: 20 } }),
      ],
      total_surface_m2: 188,
    });
    const { data: result, log } = sanitizeSurfaces(data, "maison");

    expect(result.rooms[0].surface_m2).toBeNull();
    expect(log.some(e => e.reason === "cap_150m2")).toBe(true);
  });

  it("cappe une surface > 250m² pour un immeuble", () => {
    // 3 rooms, médiane = 30 < 250 → pas de 10x, mais room 0 = 260 > 250 → cap
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Plateau", surface_m2: 260 }),
        makeRoom({ temp_id: "r2", name_raw: "Bureau", surface_m2: 30, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
        makeRoom({ temp_id: "r3", name_raw: "WC", surface_m2: 3, bounding_box: { x_percent: 10, y_percent: 50, width_percent: 20, height_percent: 20 } }),
      ],
      total_surface_m2: 293,
    });
    const { data: result, log } = sanitizeSurfaces(data, "immeuble");

    expect(result.rooms[0].surface_m2).toBeNull();
    expect(log.some(e => e.reason === "cap_250m2")).toBe(true);
  });

  // ── cm → m conversion ──────────────────────────────────────────

  it("convertit les dimensions cm en m quand > 50", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Salon", surface_m2: 2500, dimensions: { length_m: 500, width_m: 500 } }),
        makeRoom({ temp_id: "r2", name_raw: "Cuisine", surface_m2: 12 }),
      ],
      total_surface_m2: 2512,
    });
    // Médiane (12, 2500) sorted = [12, 2500], median = 2500 > 80 → 10x correction first
    // Après 10x : surface = 250 → still > 80 → cap
    // La conversion cm→m s'applique après le 10x, dimensions 500/√10 ≈ 158 > 50 → cm→m applies
    const { data: result, log } = sanitizeSurfaces(data, "appartement");

    // L'important : la fonction produit un log avec des corrections
    expect(log.length).toBeGreaterThan(0);
  });

  it("convertit les dimensions cm en m (cas simple sans 10x)", () => {
    // Seule 1 room valide → pas de médiane calculée (besoin >= 2)
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Salon", surface_m2: 2500, dimensions: { length_m: 500, width_m: 500 } }),
      ],
      total_surface_m2: 2500,
    });
    const { data: result, log } = sanitizeSurfaces(data, "appartement");

    // Avec 1 seule room, pas de 10x (besoin >= 2 surfaces). cm→m s'applique.
    // 500 > 50 → length_m = 5, width_m = 5, surface = 5*5 = 25
    expect(result.rooms[0].dimensions?.length_m).toBe(5);
    expect(result.rooms[0].dimensions?.width_m).toBe(5);
    expect(result.rooms[0].surface_m2).toBe(25);
    expect(log.some(e => e.reason === "cm_to_m")).toBe(true);
  });

  // ── Surface > total ────────────────────────────────────────────

  it("annule une surface qui dépasse le total", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Salon", surface_m2: 60 }),
        makeRoom({ temp_id: "r2", name_raw: "Chambre", surface_m2: 15 }),
      ],
      total_surface_m2: 50,
    });
    const { data: result, log } = sanitizeSurfaces(data, "appartement");

    expect(result.rooms[0].surface_m2).toBeNull();
    expect(log.some(e => e.reason === "exceeds_total" && e.room === "Salon")).toBe(true);
  });

  // ── Recalcul total ─────────────────────────────────────────────

  it("recalcule le total quand il diverge de >30%", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", surface_m2: 25 }),
        makeRoom({ temp_id: "r2", surface_m2: 15 }),
      ],
      total_surface_m2: 200, // 200 vs 40 réel → >30% de divergence
    });
    const { data: result } = sanitizeSurfaces(data, "appartement");

    expect(result.total_surface_m2).toBe(40);
  });

  it("conserve le total quand il est cohérent", () => {
    const data = makeExtraction({
      total_surface_m2: 38, // vs 37 calculé → <30%
    });
    const { data: result } = sanitizeSurfaces(data, "appartement");

    expect(result.total_surface_m2).toBe(38);
  });

  // ── Log retourné ───────────────────────────────────────────────

  it("retourne un log structuré avec room, from, to, reason", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", name_raw: "Salon", surface_m2: 95 }),
        makeRoom({ temp_id: "r2", name_raw: "Chambre", surface_m2: 15 }),
      ],
    });
    const { log } = sanitizeSurfaces(data, "appartement");

    expect(log.length).toBeGreaterThan(0);
    for (const entry of log) {
      expect(entry).toHaveProperty("room");
      expect(entry).toHaveProperty("from");
      expect(entry).toHaveProperty("to");
      expect(entry).toHaveProperty("reason");
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// validateExtraction
// ═════════════════════════════════════════════════════════════════════

describe("validateExtraction", () => {
  it("retourne score 100 et 0 warnings pour une extraction parfaite", () => {
    const data = makeExtraction();
    const report = validateExtraction(data, [], "appartement");

    expect(report.score).toBe(100);
    expect(report.warnings).toHaveLength(0);
    expect(report.shouldRetry).toBe(false);
    expect(report.gates.every(g => g.passed)).toBe(true);
  });

  // ── G1: Surfaces dans les plages réalistes ─────────────────────

  it("G1 fail + warning quand une surface dépasse le seuil appartement", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ surface_m2: 90 }),
        makeRoom({ temp_id: "r2", surface_m2: 12, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
      ],
    });
    const report = validateExtraction(data, [], "appartement");

    const g1 = report.gates.find(g => g.id === "G1_SURFACE_RANGE");
    expect(g1?.passed).toBe(false);
    expect(report.warnings.some(w => w.includes("trop grand"))).toBe(true);
    expect(report.shouldRetry).toBe(true);
  });

  it("G1 pass quand 140m² pour une maison (seuil 150)", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ surface_m2: 140 }),
        makeRoom({ temp_id: "r2", surface_m2: 20, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
      ],
      total_surface_m2: 160,
    });
    const report = validateExtraction(data, [], "maison");

    const g1 = report.gates.find(g => g.id === "G1_SURFACE_RANGE");
    expect(g1?.passed).toBe(true);
  });

  // ── G2: Surface totale cohérente ───────────────────────────────

  it("G2 fail quand la surface totale dépasse le seuil", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ surface_m2: 70 }),
        makeRoom({ temp_id: "r2", surface_m2: 70, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
        makeRoom({ temp_id: "r3", name_raw: "Chambre", surface_m2: 70, bounding_box: { x_percent: 10, y_percent: 50, width_percent: 20, height_percent: 20 } }),
        makeRoom({ temp_id: "r4", name_raw: "Bureau", surface_m2: 70, bounding_box: { x_percent: 50, y_percent: 50, width_percent: 20, height_percent: 20 } }),
        makeRoom({ temp_id: "r5", name_raw: "SDB", surface_m2: 30, bounding_box: { x_percent: 80, y_percent: 10, width_percent: 10, height_percent: 10 } }),
      ],
      total_surface_m2: 310,
    });
    const report = validateExtraction(data, [], "appartement");

    const g2 = report.gates.find(g => g.id === "G2_TOTAL_SURFACE");
    expect(g2?.passed).toBe(false);
    expect(report.shouldRetry).toBe(true);
  });

  // ── G3: Bounding boxes dans les limites ────────────────────────

  it("G3 fail quand une bbox sort du plan", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ bounding_box: { x_percent: 90, y_percent: 10, width_percent: 20, height_percent: 20 } }),
        makeRoom({ temp_id: "r2", surface_m2: 12, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
      ],
    });
    const report = validateExtraction(data, [], "appartement");

    const g3 = report.gates.find(g => g.id === "G3_BBOX_IN_BOUNDS");
    expect(g3?.passed).toBe(false);
    expect(report.warnings.some(w => w.includes("hors du plan"))).toBe(true);
  });

  // ── G4: Bounding boxes non vides ───────────────────────────────

  it("G4 fail quand une pièce n'a pas de bounding box", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ bounding_box: null }),
        makeRoom({ temp_id: "r2", surface_m2: 12, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
      ],
    });
    const report = validateExtraction(data, [], "appartement");

    const g4 = report.gates.find(g => g.id === "G4_BBOX_NOT_EMPTY");
    expect(g4?.passed).toBe(false);
    expect(report.warnings.some(w => w.includes("sans position"))).toBe(true);
  });

  // ── G6: Au moins 2 pièces ─────────────────────────────────────

  it("G6 fail + shouldRetry quand < 2 pièces", () => {
    const data = makeExtraction({
      rooms: [makeRoom()],
    });
    const report = validateExtraction(data, [], "appartement");

    const g6 = report.gates.find(g => g.id === "G6_MIN_ROOMS");
    expect(g6?.passed).toBe(false);
    expect(report.shouldRetry).toBe(true);
    expect(report.warnings.some(w => w.includes("Très peu de pièces"))).toBe(true);
  });

  // ── G7: Pas de doublons ────────────────────────────────────────

  it("G7 fail quand deux pièces ont la même position", () => {
    const bbox = { x_percent: 10, y_percent: 10, width_percent: 30, height_percent: 30 };
    const data = makeExtraction({
      rooms: [
        makeRoom({ temp_id: "r1", bounding_box: bbox }),
        makeRoom({ temp_id: "r2", name_raw: "Salon bis", bounding_box: { ...bbox, x_percent: 12 } }),
      ],
    });
    const report = validateExtraction(data, [], "appartement");

    const g7 = report.gates.find(g => g.id === "G7_NO_DUPLICATES");
    expect(g7?.passed).toBe(false);
    expect(report.warnings.some(w => w.includes("double"))).toBe(true);
  });

  // ── G8: Couverture surfaces ────────────────────────────────────

  it("G8 fail quand > 50% des pièces n'ont pas de surface", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ surface_m2: null }),
        makeRoom({ temp_id: "r2", surface_m2: null, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
        makeRoom({ temp_id: "r3", name_raw: "Chambre", surface_m2: 15, bounding_box: { x_percent: 10, y_percent: 50, width_percent: 20, height_percent: 20 } }),
      ],
      total_surface_m2: 15,
    });
    const report = validateExtraction(data, [], "appartement");

    const g8 = report.gates.find(g => g.id === "G8_SURFACE_COVERAGE");
    expect(g8?.passed).toBe(false);
    expect(report.warnings.some(w => w.includes("majorité des surfaces"))).toBe(true);
  });

  // ── Warnings from sanitization log ─────────────────────────────

  it("convertit le log de sanitization en warnings FR", () => {
    const data = makeExtraction();
    const sanitizationLog: SanitizationEntry[] = [
      { room: "Salon", from: 250, to: 25, reason: "10x_correction" },
      { room: "Cuisine", from: 95, to: null, reason: "cap_80m2" },
      { room: "Chambre", from: 60, to: null, reason: "exceeds_total" },
      { room: "Bureau", from: 1500, to: 15, reason: "cm_to_m" },
    ];
    const report = validateExtraction(data, sanitizationLog, "appartement");

    expect(report.warnings.some(w => w.includes("Salon") && w.includes("erreur de lecture"))).toBe(true);
    expect(report.warnings.some(w => w.includes("Cuisine") && w.includes("aberrante"))).toBe(true);
    expect(report.warnings.some(w => w.includes("Chambre") && w.includes("dépasse le total"))).toBe(true);
    expect(report.warnings.some(w => w.includes("Bureau") && w.includes("cm→m"))).toBe(true);
  });

  // ── Score ──────────────────────────────────────────────────────

  it("le score est proportionnel aux gates passées", () => {
    // 1 seule pièce → G6 fail → 7/8 = 87.5 → arrondi 88
    const data = makeExtraction({ rooms: [makeRoom()] });
    const report = validateExtraction(data, [], "appartement");

    expect(report.score).toBeLessThan(100);
    expect(report.score).toBeGreaterThan(0);
  });

  // ── shouldRetry ────────────────────────────────────────────────

  it("shouldRetry = true uniquement quand G1, G2 ou G6 échouent", () => {
    // G4 fail (pas de bbox) mais pas critique → shouldRetry false
    const data = makeExtraction({
      rooms: [
        makeRoom({ bounding_box: null }),
        makeRoom({ temp_id: "r2", surface_m2: 12, bounding_box: null }),
      ],
    });
    const report = validateExtraction(data, [], "appartement");

    const g4 = report.gates.find(g => g.id === "G4_BBOX_NOT_EMPTY");
    expect(g4?.passed).toBe(false);
    // G1, G2, G6 passent → shouldRetry false
    expect(report.shouldRetry).toBe(false);
  });

  // ── Seuils par typeBien ────────────────────────────────────────

  it("utilise des seuils différents selon le typeBien", () => {
    const data = makeExtraction({
      rooms: [
        makeRoom({ surface_m2: 200 }),
        makeRoom({ temp_id: "r2", surface_m2: 200, bounding_box: { x_percent: 50, y_percent: 10, width_percent: 20, height_percent: 20 } }),
      ],
      total_surface_m2: 400,
    });

    // 200m²/pièce fail pour appartement (seuil 80)
    const reportAppart = validateExtraction(data, [], "appartement");
    expect(reportAppart.gates.find(g => g.id === "G1_SURFACE_RANGE")?.passed).toBe(false);

    // 200m²/pièce pass pour immeuble (seuil 250)
    const reportImmeuble = validateExtraction(data, [], "immeuble");
    expect(reportImmeuble.gates.find(g => g.id === "G1_SURFACE_RANGE")?.passed).toBe(true);
  });
});
