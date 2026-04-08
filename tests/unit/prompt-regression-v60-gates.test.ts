/**
 * Prompt Regression Gates v60 — Catégories Q (anti-human canalisation),
 * R (water heaters HIDE_IF_UGLY), S (adjust anti-human), T (adjust frame lock),
 * U (bathroom Step 1 preserves existing), V (PROMPT_VERSION bump v60).
 *
 * Owner : @ia (session 38, v60, audit Lucas Moreau production batch #238-241)
 *
 * Ces gates ont été ajoutées APRÈS l'audit Lucas v59 qui a révélé 3 bugs
 * structurels : (1) humains persistants malgré CLEANUP_V53 (#238/#241),
 * (2) ballon d'eau chaude préservé à tort (#240), (3) équipements muraux
 * existants effacés en bathroom Step 1 (#239).
 *
 * Chaque gate est conçue pour FAIL sur le code v59 et PASS sur v60.
 *
 * Principe directeur : les gates v59 (I-P) vérifient la présence de
 * verbes d'action et de la structure TEMPORARY/PERMANENT, mais ne vérifient
 * pas (a) la POSITION de la clause anti-humain dans CLEANUP_V53, (b) la
 * présence d'une clause HIDE_IF_UGLY, (c) l'anti-humain en mode adjust,
 * (d) le lock frame strict en mode adjust, (e) la préservation explicite
 * en bathroom Step 1 narrow.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  PROMPT_VERSION,
  buildSurfacesResponsesPrompt,
} from "@/lib/generation-pipeline";

import { ROOM_TYPES } from "@/lib/room-types";
import {
  buildAdjustResponsesPrompt,
} from "@/lib/iteration-prompt";

const ROOT = resolve(__dirname, "../..");
const PIPELINE_SRC = readFileSync(resolve(ROOT, "lib/generation-pipeline.ts"), "utf8");
const ITERATION_SRC = readFileSync(resolve(ROOT, "lib/iteration-prompt.ts"), "utf8");

const SAMPLE_SURFACE = "Sample surface: white walls, oak floor, white ceiling, pendant light";

const PASS1_ROOM_BRANCHES: Array<string | null> = [
  "kitchen",
  "bathroom",
  "wc",
  "bedroom_adults",
  "bedroom_children",
  "laundry",
  "cellar",
  "entryway",
  null,
];

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE Q — ANTI-HUMAN CANALISATION (Lucas #238/#241)
// ═══════════════════════════════════════════════════════════════════════
// Principe : la clause anti-humain de CLEANUP_V53 doit être en POSITION
// INITIALE de la liste REMOVE pour maximiser l'attention du modèle, et
// une assertion finale dupliquée doit enforcer le résultat. v59 listait
// les humains mais en milieu de liste + phrase finale diluée dans
// "no furniture, no new fixtures" → 3/4 générations livraient des humains.

describe("G-PROMPT-Q01 — CLEANUP anti-human clause is at FIRST position of REMOVE list (v60 Lucas #238)", () => {
  // Pattern : "REMOVE only these TEMPORARY construction items: any people visible..."
  // Les "people" doivent être la PREMIÈRE item de la liste, pas en milieu.
  const FIRST_POSITION_PATTERN =
    /REMOVE\s+only\s+these\s+TEMPORARY\s+construction\s+items:\s*any\s+people\s+visible/i;

  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 ${roomType ?? "fallback"}: people visible is the FIRST REMOVE item`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(
        prompt,
        `CLEANUP in ${roomType ?? "fallback"} does not start REMOVE list with 'any people visible'`,
      ).toMatch(FIRST_POSITION_PATTERN);
    });
  });

  it("generation-pipeline.ts source: CLEANUP_V53 constant starts REMOVE with people", () => {
    expect(PIPELINE_SRC).toMatch(FIRST_POSITION_PATTERN);
  });
});

describe("G-PROMPT-Q02 — CLEANUP has duplicated final assertion 'zero humans' (v60 Lucas #238/#241)", () => {
  // Pattern : assertion finale positive dupliquée "output MUST show zero humans"
  // séparée par un point. Cette phrase doit être AVANT "No furniture, no new fixtures"
  // pour que l'attention finale du modèle pointe sur l'anti-humain.
  const ZERO_HUMANS_PATTERN = /output\s+MUST\s+show\s+zero\s+humans/i;

  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 ${roomType ?? "fallback"}: contains 'output MUST show zero humans' assertion`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toMatch(ZERO_HUMANS_PATTERN);
    });
  });

  it("generation-pipeline.ts source contains the duplicated zero humans assertion", () => {
    expect(PIPELINE_SRC).toMatch(ZERO_HUMANS_PATTERN);
  });

  it("pass1 (bathroom): zero humans assertion lists zero hands, zero arms, zero silhouettes", () => {
    const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, "bathroom", "");
    expect(prompt).toMatch(/zero\s+hands/i);
    expect(prompt).toMatch(/zero\s+arms/i);
    expect(prompt).toMatch(/zero\s+silhouettes/i);
  });
});

describe("G-PROMPT-Q03 — CLEANUP final assertion is positioned BEFORE 'No furniture' (v60)", () => {
  // Gate anti-régression : la clause "zero humans" doit précéder "No furniture"
  // dans la chaîne finale, sinon l'attention du modèle se disperse sur
  // "no furniture, no new fixtures" et l'anti-humain est dilué.
  it("pass1 (fallback): 'zero humans' appears BEFORE 'No furniture'", () => {
    const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, null, "");
    const zeroIdx = prompt.search(/zero\s+humans/i);
    const noFurnIdx = prompt.search(/No\s+furniture/i);
    expect(zeroIdx).toBeGreaterThan(-1);
    expect(noFurnIdx).toBeGreaterThan(-1);
    expect(
      zeroIdx,
      `'zero humans' (idx ${zeroIdx}) must appear BEFORE 'No furniture' (idx ${noFurnIdx}) for attention canalization`,
    ).toBeLessThan(noFurnIdx);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE R — WATER HEATERS HIDE_IF_UGLY (Lucas #240)
// ═══════════════════════════════════════════════════════════════════════
// Principe : CLEANUP_V53 ne doit PAS lister "water heaters" ou "boilers"
// dans la PRESERVE PERMANENT list (v59 les préservait → ballon visible
// sur les rendus Thomas marchand). À la place, une nouvelle catégorie
// HIDE_IF_UGLY doit donner au modèle la permission de les cacher.

describe("G-PROMPT-R01 — CLEANUP does NOT list water heaters/boilers in PRESERVE PERMANENT (v60 Lucas #240)", () => {
  // Pattern : extraire la section "PRESERVE all PERMANENT wall-mounted or built-in equipment: ..."
  // et vérifier qu'elle ne contient PAS water heaters / boilers.
  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 ${roomType ?? "fallback"}: PRESERVE section does NOT list water heaters`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      const preserveSection = prompt.match(/PRESERVE\s+all\s+PERMANENT[^.]*\./i);
      expect(preserveSection, `no PRESERVE section found in ${roomType ?? "fallback"}`).not.toBeNull();
      expect(preserveSection![0]).not.toMatch(/\bwater\s+heaters?\b/i);
      expect(preserveSection![0]).not.toMatch(/\bboilers?\b/i);
    });
  });

  it("generation-pipeline.ts source: PRESERVE section does not list water heaters/boilers", () => {
    // Pattern multi-ligne non-greedy pour extraire la clause PRESERVE
    const preserveMatch = PIPELINE_SRC.match(/PRESERVE\s+all\s+PERMANENT[^"]*?\./);
    expect(preserveMatch).not.toBeNull();
    expect(preserveMatch![0]).not.toMatch(/\bwater\s+heaters?\b/i);
    expect(preserveMatch![0]).not.toMatch(/\bboilers?\b/i);
  });
});

describe("G-PROMPT-R02 — CLEANUP contains HIDE_IF_UGLY clause mentioning water heaters (v60 Lucas #240)", () => {
  // Pattern : "HIDE OR REMOVE if aesthetically inappropriate: water heaters, boilers, exposed gas pipes."
  const HIDE_IF_UGLY_PATTERN =
    /HIDE\s+OR\s+REMOVE\s+if\s+aesthetically\s+inappropriate[^.]*water\s+heaters?/i;

  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 ${roomType ?? "fallback"}: contains HIDE_IF_UGLY clause with water heaters`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toMatch(HIDE_IF_UGLY_PATTERN);
    });
  });

  it("generation-pipeline.ts source contains HIDE_IF_UGLY clause", () => {
    expect(PIPELINE_SRC).toMatch(HIDE_IF_UGLY_PATTERN);
  });

  it("HIDE_IF_UGLY clause mentions boilers AND exposed gas pipes", () => {
    const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, null, "");
    const hideMatch = prompt.match(/HIDE\s+OR\s+REMOVE\s+if\s+aesthetically\s+inappropriate[^.]*\./i);
    expect(hideMatch).not.toBeNull();
    expect(hideMatch![0]).toMatch(/\bboilers?\b/i);
    expect(hideMatch![0]).toMatch(/exposed\s+gas\s+pipes/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE S — ADJUST MODE ANTI-HUMAN (Lucas #241)
// ═══════════════════════════════════════════════════════════════════════
// Principe : buildAdjustResponsesPrompt doit contenir une clause anti-humain
// explicite. v59 n'avait aucun anti-personne en mode adjust → #238 → #241
// iteration régénérait les humains (dans des poses différentes).

describe("G-PROMPT-S01 — buildAdjustResponsesPrompt contains explicit anti-human clause (v60 Lucas #241)", () => {
  it("adjust indoor prompt contains 'No humans' directive", () => {
    const prompt = buildAdjustResponsesPrompt(
      "Add a rug",
      "Add a rug",
      { roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/No\s+humans/i);
  });

  it("adjust indoor prompt contains 'regardless of whether they were in the input'", () => {
    const prompt = buildAdjustResponsesPrompt(
      "Add a rug",
      "Add a rug",
      { roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/regardless\s+of\s+whether\s+they\s+were\s+in\s+the\s+input/i);
  });

  it("adjust indoor prompt lists 'workers, hands, arms'", () => {
    const prompt = buildAdjustResponsesPrompt(
      "Add a rug",
      "Add a rug",
      { roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/no\s+workers?/i);
    expect(prompt).toMatch(/no\s+hands?/i);
    expect(prompt).toMatch(/no\s+arms?/i);
  });

  it("adjust indoor prompt has fill-area directive for removed persons", () => {
    const prompt = buildAdjustResponsesPrompt(
      "Add a rug",
      "Add a rug",
      { roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/If\s+the\s+input\s+contains\s+any\s+person,\s+remove\s+them/i);
    expect(prompt).toMatch(/fill\s+the\s+vacated\s+area/i);
  });

  it("iteration-prompt.ts source contains the anti-human clause", () => {
    expect(ITERATION_SRC).toMatch(/No\s+humans,?\s+no\s+workers/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE T — ADJUST MODE FRAME LOCK (Lucas #241)
// ═══════════════════════════════════════════════════════════════════════
// Principe : buildAdjustResponsesPrompt doit contenir un lock explicite
// du frame (aspect ratio + crop edges + composition). v59 disait "same
// camera angle" mais pas "same aspect ratio" → le frame s'élargissait
// quand le ratio input ne collait pas à 1024x1536 / 1536x1024.

describe("G-PROMPT-T01 — buildAdjustResponsesPrompt contains strict frame lock (v60 Lucas #241)", () => {
  it("adjust indoor prompt contains 'aspect ratio' directive", () => {
    const prompt = buildAdjustResponsesPrompt(
      "Add a rug",
      "Add a rug",
      { roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/aspect\s+ratio/i);
  });

  it("adjust indoor prompt contains 'crop edges' directive", () => {
    const prompt = buildAdjustResponsesPrompt(
      "Add a rug",
      "Add a rug",
      { roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/crop\s+edges/i);
  });

  it("adjust indoor prompt contains 'match the input EXACTLY'", () => {
    const prompt = buildAdjustResponsesPrompt(
      "Add a rug",
      "Add a rug",
      { roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/match\s+the\s+input\s+EXACTLY/i);
  });

  it("adjust indoor prompt forbids re-framing", () => {
    const prompt = buildAdjustResponsesPrompt(
      "Add a rug",
      "Add a rug",
      { roomType: null, allowWallMounted: false },
    );
    expect(prompt).toMatch(/Do\s+not\s+re-frame/i);
    expect(prompt).toMatch(/Do\s+not\s+widen/i);
  });

  it("iteration-prompt.ts source contains the strict frame lock clause", () => {
    expect(ITERATION_SRC).toMatch(/aspect\s+ratio,\s+crop\s+edges/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE U — BATHROOM STEP 1 PRESERVES EXISTING EQUIPMENT (Lucas #239)
// ═══════════════════════════════════════════════════════════════════════
// Principe : bathroom roomFurnitureOverride Step 1 doit contenir une
// directive explicite "Step 1 does NOT remove anything that exists in
// the input". v59 avait "ADD nothing on the walls" qui était interprété
// comme licence pour RETIRER les équipements muraux existants.

describe("G-PROMPT-U01 — bathroom Step 1 has explicit preservation of existing equipment (v60 Lucas #239)", () => {
  it("bathroom override contains 'Step 1 does NOT remove anything'", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    expect(override).toMatch(/Step\s+1\s+does\s+NOT\s+remove\s+anything/i);
  });

  it("bathroom override preserves existing towel dryers in Step 1", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    expect(override).toMatch(/Existing\s+towel\s+dryers/i);
  });

  it("bathroom override preserves existing convectors in Step 1", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    expect(override).toMatch(/convectors/i);
    // Vérifier que la phrase parle bien de "stay exactly at their current positions"
    expect(override).toMatch(/stay\s+exactly\s+at\s+their\s+current\s+positions/i);
  });

  it("bathroom override preserves existing radiators in Step 1", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    expect(override).toMatch(/radiators/i);
  });

  it("bathroom override Step 1 preservation appears BEFORE Step 2 (sequence matters)", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    const preserveIdx = override.search(/Step\s+1\s+does\s+NOT\s+remove/i);
    const step2Idx = override.search(/Step\s+2\s+—\s+standard\s+bathroom/i);
    expect(preserveIdx).toBeGreaterThan(-1);
    expect(step2Idx).toBeGreaterThan(-1);
    expect(
      preserveIdx,
      "Step 1 preservation clause must appear BEFORE Step 2 in sequence",
    ).toBeLessThan(step2Idx);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE V — PROMPT_VERSION BUMP v60
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-V01 — PROMPT_VERSION is at least v60 (session 38 Lucas audit fix)", () => {
  it("PROMPT_VERSION matches v60 or higher", () => {
    expect(PROMPT_VERSION).toMatch(/^v\d+/);
    const num = parseInt(PROMPT_VERSION.replace(/^v/, ""), 10);
    expect(num, `PROMPT_VERSION=${PROMPT_VERSION} is below v60`).toBeGreaterThanOrEqual(60);
  });

  it("PROMPT_VERSION pattern matches v60/v61/... numeric format", () => {
    expect(PROMPT_VERSION).toMatch(/^v(60|61|62|6\d|[7-9]\d|\d{3,})$/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SANITY : baseline files loaded
// ═══════════════════════════════════════════════════════════════════════

describe("Meta — source files loaded for v60 gates", () => {
  it("generation-pipeline.ts source loaded", () => {
    expect(PIPELINE_SRC.length).toBeGreaterThan(1000);
  });
  it("iteration-prompt.ts source loaded", () => {
    expect(ITERATION_SRC.length).toBeGreaterThan(500);
  });
});
