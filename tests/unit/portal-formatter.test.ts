/**
 * Unit tests for lib/portal-formatter.ts — Export Portails V2a.
 *
 * Pure functions, no DOM, no API calls.
 * Run with: npx tsx tests/unit/portal-formatter.test.ts
 *
 * WHY these tests exist:
 * - Portal text limits are contractual (LeBonCoin rejects >100 char titles)
 * - Truncation bugs = broken annonces on portals = lost leads for marchands
 * - AI disclaimer is legally required (photos non contractuelles)
 * - Each portal has different rules — a single formatter must handle all 3
 */

import assert from "node:assert/strict";
import {
  formatTitle,
  formatDescription,
  formatForPortal,
  getPhotoSortPriority,
  PORTAL_CONFIGS,
  AI_DISCLAIMER,
  type AnnonceData,
  type PortalId,
} from "../../lib/portal-formatter";

// ─── Test helpers ──────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err: unknown) {
    failed++;
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    console.log(`  FAIL  ${name}`);
    console.log(`        ${msg}`);
  }
}

// ─── Fixtures ──────────────────────────────────────────────────────

const FULL_ANNONCE: AnnonceData = {
  title: "Appartement T3 lumineux avec balcon — Bordeaux Chartrons",
  description:
    "Bel appartement de 65m2 situe au 3eme etage d'un immeuble en pierre.\n\n" +
    "Il comprend un sejour lumineux, une cuisine amenagee, deux chambres et une salle de bain.\n\n" +
    "Balcon expose sud-ouest avec vue degagee sur les quais.",
  surface: 65,
  roomCount: 3,
  price: 285000,
  city: "Bordeaux",
  propertyType: "Appartement",
  isCopro: true,
  coproLots: 12,
  coproChargesAnnuelles: 1800,
  dpeClasse: "C",
  gesClasse: "B",
  totalPhotos: 8,
};

const MINIMAL_ANNONCE: AnnonceData = {
  title: "",
  description: "",
  surface: null,
  roomCount: null,
  price: null,
  city: "",
  propertyType: "",
  isCopro: false,
  totalPhotos: 0,
};

// ─── formatTitle ───────────────────────────────────────────────────

console.log("\nformatTitle:");

test("short title — no truncation", () => {
  const result = formatTitle("Court", 100);
  assert.equal(result.text, "Court");
  assert.equal(result.truncated, false);
  assert.equal(result.charCount, 5);
  assert.equal(result.maxChars, 100);
});

test("title at exact limit — no truncation", () => {
  const title50 = "A".repeat(50);
  const result = formatTitle(title50, 50);
  assert.equal(result.truncated, false);
  assert.equal(result.charCount, 50);
});

test("long title — truncated at last word boundary + ellipsis", () => {
  // 120 chars exceeds 100 limit
  const longTitle =
    "Superbe appartement T4 avec terrasse panoramique et vue mer a Nice Promenade des Anglais quartier historique centre ville";
  const result = formatTitle(longTitle, 100);

  assert.equal(result.truncated, true);
  assert.ok(
    result.text.endsWith("\u2026"),
    "Truncated title must end with ellipsis character"
  );
  assert.ok(
    result.charCount <= 100,
    `Title charCount ${result.charCount} exceeds maxChars 100`
  );
  // Must cut at a word boundary, not mid-word
  assert.ok(
    !result.text.slice(0, -1).endsWith(" "),
    "Should not have trailing space before ellipsis"
  );
});

test("single long word without spaces — truncated at hard limit", () => {
  const noSpaces = "A".repeat(150);
  const result = formatTitle(noSpaces, 100);

  assert.equal(result.truncated, true);
  assert.ok(result.charCount <= 100, "Must respect maxChars even without spaces");
});

test("empty title — returns empty string, not truncated", () => {
  const result = formatTitle("", 100);
  assert.equal(result.text, "");
  assert.equal(result.truncated, false);
  assert.equal(result.charCount, 0);
});

test("title with HTML tags — tags stripped", () => {
  const result = formatTitle("Appartement <b>lumineux</b> centre-ville", 100);
  assert.equal(result.text, "Appartement lumineux centre-ville");
  assert.ok(!result.text.includes("<"), "HTML tags must be stripped");
});

test("title with curly quotes — normalized to straight quotes", () => {
  const result = formatTitle("L\u2019appartement \u00ABcharmant\u00BB", 100);
  assert.ok(
    result.text.includes("'"),
    "Curly single quote should become straight"
  );
  assert.ok(
    result.text.includes('"'),
    "Guillemets should become straight double quotes"
  );
});

// ─── formatDescription ─────────────────────────────────────────────

console.log("\nformatDescription:");

test("short description — disclaimer appended, not truncated", () => {
  const config = PORTAL_CONFIGS.leboncoin; // 4000 chars
  const result = formatDescription("Texte court", config);

  assert.equal(result.truncated, false);
  assert.ok(
    result.text.includes(AI_DISCLAIMER),
    "Disclaimer must be present in output"
  );
  assert.ok(
    result.text.startsWith("Texte court"),
    "Original text must be preserved"
  );
  assert.ok(
    result.charCount <= config.descriptionMaxChars,
    "Must not exceed portal limit"
  );
});

test("long description — truncated at paragraph boundary", () => {
  // Create a description that exceeds SeLoger's 2000 char limit (body must exceed ~1911 chars after disclaimer reservation)
  const config = PORTAL_CONFIGS.seloger; // 2000 chars
  const paragraph = "Lorem ipsum dolor sit amet consectetur adipiscing elit. ".repeat(20);
  const longDesc = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;

  const result = formatDescription(longDesc, config, { stripEmoji: true });

  assert.equal(result.truncated, true);
  assert.ok(
    result.charCount <= config.descriptionMaxChars,
    `charCount ${result.charCount} exceeds limit ${config.descriptionMaxChars}`
  );
  assert.ok(
    result.text.includes(AI_DISCLAIMER),
    "Disclaimer must be present even when truncated"
  );
});

test("empty description — returns placeholder + disclaimer", () => {
  const config = PORTAL_CONFIGS.leboncoin;
  const result = formatDescription("", config);

  assert.equal(result.truncated, false);
  assert.ok(
    result.text.includes("Description"),
    "Empty description should have a placeholder"
  );
  assert.ok(
    result.text.includes(AI_DISCLAIMER),
    "Disclaimer must be present even with empty description"
  );
});

test("description that fits exactly with disclaimer — not truncated", () => {
  const config = PORTAL_CONFIGS.leboncoin; // 4000 chars
  const disclaimerLen = ("\n\n" + AI_DISCLAIMER).length;
  const bodyLimit = config.descriptionMaxChars - disclaimerLen;
  const exactFit = "X".repeat(bodyLimit);

  const result = formatDescription(exactFit, config);

  assert.equal(result.truncated, false);
  assert.ok(
    result.charCount <= config.descriptionMaxChars,
    "Should fit exactly within limit"
  );
});

test("SeLoger strips emojis from description", () => {
  const config = PORTAL_CONFIGS.seloger;
  const withEmoji = "Appartement lumineux \u2728 avec terrasse \u2600\uFE0F";

  const result = formatDescription(withEmoji, config, { stripEmoji: true });

  // Misc symbol U+2728 and U+2600 should be stripped
  assert.ok(
    !result.text.includes("\u2728"),
    "Sparkle emoji should be stripped for SeLoger"
  );
});

// ─── formatForPortal ────────────────────────────────────────────────

console.log("\nformatForPortal:");

test("LeBonCoin — returns correct format (no structured fields)", () => {
  const result = formatForPortal("leboncoin", FULL_ANNONCE);

  assert.equal(result.portal.id, "leboncoin");
  assert.equal(result.portal.label, "LeBonCoin");
  assert.equal(result.structuredFields.length, 0);
  assert.ok(result.title.charCount <= 100, "LBC title max 100 chars");
  assert.ok(
    result.description.charCount <= 4000,
    "LBC description max 4000 chars"
  );
  assert.ok(
    result.copyText.includes(result.title.text),
    "copyText must include title"
  );
  assert.ok(
    result.copyText.includes(AI_DISCLAIMER),
    "copyText must include disclaimer"
  );
  // LBC copyText should NOT have structured fields separator
  assert.ok(
    !result.copyText.includes("Champs"),
    "LBC copyText should not have structured fields"
  );
});

test("SeLoger — returns structured fields", () => {
  const result = formatForPortal("seloger", FULL_ANNONCE);

  assert.equal(result.portal.id, "seloger");
  assert.ok(
    result.structuredFields.length > 0,
    "SeLoger must have structured fields"
  );

  // Check expected fields
  const labels = result.structuredFields.map((f) => f.label);
  assert.ok(labels.includes("Surface"), "Must have Surface field");
  assert.ok(labels.includes("Prix"), "Must have Prix field");
  assert.ok(labels.includes("DPE"), "Must have DPE field");
  assert.ok(labels.includes("Ville"), "Must have Ville field");

  // CopyText should include field section
  assert.ok(
    result.copyText.includes("Champs"),
    "SeLoger copyText must include structured fields section"
  );
});

test("Bien'ici — returns structured fields with copro info", () => {
  const result = formatForPortal("bienici", FULL_ANNONCE);

  assert.equal(result.portal.id, "bienici");
  assert.ok(result.structuredFields.length > 0);

  const coproField = result.structuredFields.find(
    (f) => f.label === "Copropriete" || f.label === "Copropri\u00e9t\u00e9"
  );
  assert.ok(coproField, "Must have Copropriete field when isCopro=true");
  assert.ok(
    coproField!.value.includes("12"),
    "Copro field must show lot count"
  );
});

test("missing DPE — warning flag set", () => {
  const noDpe: AnnonceData = { ...FULL_ANNONCE, dpeClasse: null };
  const result = formatForPortal("seloger", noDpe);

  const dpeField = result.structuredFields.find((f) => f.label === "DPE");
  assert.ok(dpeField, "DPE field must exist even when missing");
  assert.equal(dpeField!.warning, true, "Missing DPE must have warning=true");
});

test("missing price — shows 'Sur demande'", () => {
  const noPrice: AnnonceData = { ...FULL_ANNONCE, price: null };
  const result = formatForPortal("seloger", noPrice);

  const priceField = result.structuredFields.find((f) => f.label === "Prix");
  assert.ok(priceField);
  assert.equal(priceField!.value, "Sur demande");
});

test("price zero — shows 'Sur demande'", () => {
  const zeroPrice: AnnonceData = { ...FULL_ANNONCE, price: 0 };
  const result = formatForPortal("seloger", zeroPrice);

  const priceField = result.structuredFields.find((f) => f.label === "Prix");
  assert.ok(priceField);
  assert.equal(priceField!.value, "Sur demande");
});

test("isCopro without lots — shows warning", () => {
  const noLots: AnnonceData = {
    ...FULL_ANNONCE,
    isCopro: true,
    coproLots: null,
    coproChargesAnnuelles: null,
  };
  const result = formatForPortal("seloger", noLots);

  const coproField = result.structuredFields.find((f) =>
    f.label.includes("Copropri")
  );
  assert.ok(coproField);
  assert.equal(coproField!.warning, true);
});

test("minimal annonce — empty title/description, no crash", () => {
  const result = formatForPortal("leboncoin", MINIMAL_ANNONCE);

  assert.equal(result.title.text, "");
  assert.ok(
    result.description.text.includes(AI_DISCLAIMER),
    "Even empty annonce must have disclaimer"
  );
  assert.equal(result.photosIncluded, 0);
  assert.equal(result.photosCapped, false);
});

// ─── Photo capping ──────────────────────────────────────────────────

console.log("\nPhoto capping:");

test("LeBonCoin 20 photo cap — 25 photos capped to 20", () => {
  const many: AnnonceData = { ...FULL_ANNONCE, totalPhotos: 25 };
  const result = formatForPortal("leboncoin", many);

  assert.equal(result.photosIncluded, 20, "LBC should cap at 20");
  assert.equal(result.photosCapped, true);
});

test("LeBonCoin — 15 photos not capped", () => {
  const within: AnnonceData = { ...FULL_ANNONCE, totalPhotos: 15 };
  const result = formatForPortal("leboncoin", within);

  assert.equal(result.photosIncluded, 15);
  assert.equal(result.photosCapped, false);
});

test("SeLoger no photo limit — 50 photos not capped", () => {
  const many: AnnonceData = { ...FULL_ANNONCE, totalPhotos: 50 };
  const result = formatForPortal("seloger", many);

  assert.equal(result.photosIncluded, 50);
  assert.equal(result.photosCapped, false);
});

// ─── getPhotoSortPriority ───────────────────────────────────────────

console.log("\ngetPhotoSortPriority:");

test("living_room has highest priority (0)", () => {
  assert.equal(getPhotoSortPriority("living_room"), 0);
});

test("bedroom has priority 1", () => {
  assert.equal(getPhotoSortPriority("bedroom"), 1);
});

test("unknown room type defaults to 10", () => {
  assert.equal(getPhotoSortPriority("garage"), 10);
  assert.equal(getPhotoSortPriority("unknown_type"), 10);
});

test("room types are ordered: salon > chambre > cuisine > sdb", () => {
  const living = getPhotoSortPriority("living_room");
  const bed = getPhotoSortPriority("bedroom");
  const kitchen = getPhotoSortPriority("kitchen");
  const bath = getPhotoSortPriority("bathroom");

  assert.ok(living < bed, "living_room before bedroom");
  assert.ok(bed < kitchen, "bedroom before kitchen");
  assert.ok(kitchen < bath, "kitchen before bathroom");
});

// ─── Cross-portal consistency ───────────────────────────────────────

console.log("\nCross-portal consistency:");

test("all 3 portals return valid exports for same annonce", () => {
  const portals: PortalId[] = ["leboncoin", "seloger", "bienici"];

  for (const id of portals) {
    const result = formatForPortal(id, FULL_ANNONCE);

    assert.ok(result.portal, `${id}: portal config must exist`);
    assert.ok(result.title.text.length > 0, `${id}: title must not be empty`);
    assert.ok(
      result.description.text.includes(AI_DISCLAIMER),
      `${id}: disclaimer must be present`
    );
    assert.ok(
      result.title.charCount <= result.title.maxChars,
      `${id}: title within limit`
    );
    assert.ok(
      result.description.charCount <= result.description.maxChars,
      `${id}: description within limit`
    );
    assert.ok(result.copyText.length > 0, `${id}: copyText must not be empty`);
  }
});

test("disclaimer is always present in description across all portals", () => {
  const portals: PortalId[] = ["leboncoin", "seloger", "bienici"];
  const annonces = [FULL_ANNONCE, MINIMAL_ANNONCE];

  for (const id of portals) {
    for (const annonce of annonces) {
      const result = formatForPortal(id, annonce);
      assert.ok(
        result.description.text.includes(AI_DISCLAIMER),
        `${id} + ${annonce.title || "empty"}: disclaimer missing`
      );
    }
  }
});

// ─── Results ────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  process.exit(1);
}
console.log("All tests passed.");
process.exit(0);
