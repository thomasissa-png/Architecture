/**
 * Prompt Regression Gates — Catégorie B (structure prompts) + D (input_fidelity) + F (STYLE_VARIANTS schema).
 *
 * Spec : docs/ia/prompt-regression-gates-spec.md
 * Owner : @ia (Partie 1 — gates "simples" structure-based)
 *
 * Ces tests appellent directement les builders pour vérifier qu'ils contiennent
 * les constantes critiques (PASS1_PREAMBLE, ARCHITECTURAL_HONESTY, etc.) sur
 * TOUTES les branches roomType (8 indoor pass1, 9 indoor pass2).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  PROMPT_VERSION,
  buildSurfacesResponsesPrompt,
  buildFurnitureResponsesPrompt,
  buildOutdoorSurfacesResponsesPrompt,
  buildOutdoorFurnitureResponsesPrompt,
} from "@/lib/generation-pipeline";

import { STYLE_VARIANTS } from "@/lib/style-variants";
import { STYLES } from "@/components/StylePicker";

const ROOT = resolve(__dirname, "../..");
const PIPELINE_SRC = readFileSync(resolve(ROOT, "lib/generation-pipeline.ts"), "utf8");

// Sample style prompts to feed builders (any non-empty string works for structural checks)
const SAMPLE_SURFACE = "Sample surface: white walls, oak floor, white ceiling, pendant light";
const SAMPLE_FURNITURE = "Sample furniture: sofa 230cm, coffee table 120cm";

// Toutes les branches roomType passe 1 ET fallback (null)
const PASS1_ROOM_BRANCHES: Array<string | null> = [
  "kitchen",
  "bathroom",
  "wc",
  "bedroom_adults",
  "bedroom_children",
  "laundry",
  "cellar",
  "entryway",
  null, // fallback (living_room, dining_room, office)
];

// Toutes les branches roomType passe 2 ET fallback
const PASS2_ROOM_BRANCHES: Array<string | null> = [
  "kitchen",
  "bathroom",
  "wc",
  "bedroom_adults",
  "bedroom_children",
  "entryway",
  "laundry",
  "cellar",
  "dining_room",
  null, // fallback (living_room, office)
];

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE B — STRUCTURE DES PROMPTS
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-B01 — PROMPT_VERSION exporté et non vide (Sprint 15)", () => {
  it("PROMPT_VERSION is a non-empty string", () => {
    expect(typeof PROMPT_VERSION).toBe("string");
    expect(PROMPT_VERSION.length).toBeGreaterThan(0);
    expect(PROMPT_VERSION).toMatch(/^v\d+/i);
  });
});

describe("G-PROMPT-B02 — PASS1_PREAMBLE injecté dans toutes les branches passe 1 (Session 35)", () => {
  // Le préambule v53 commence par "STRUCTURE LOCK"
  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 builder for roomType=${roomType ?? "fallback"} contains STRUCTURE LOCK preamble`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toContain("STRUCTURE LOCK");
    });
  });
});

// v57: clause ARCHITECTURAL_HONESTY_V55 supprimée par rollback Option 2 décision 087e38b
describe.skip("G-PROMPT-B03 — ARCHITECTURAL HONESTY injecté dans toutes les branches passe 1 (v55 P0-C)", () => {
  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 builder for roomType=${roomType ?? "fallback"} contains ARCHITECTURAL HONESTY clause`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toContain("ARCHITECTURAL HONESTY");
    });
  });
});

describe("G-PROMPT-B04 — PASS2_PREAMBLE injecté dans toutes les branches passe 2 (Sprint 22)", () => {
  // PASS2_PREAMBLE_V54 commence par "Edit this photo of a finished room"
  PASS2_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass2 builder for roomType=${roomType ?? "fallback"} contains preamble`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      expect(prompt).toContain("Edit this photo of a finished room");
    });
  });
});

describe("G-PROMPT-B05 — pass 2 utilise une instruction ADD/Add en position instructive (Sprint 11)", () => {
  // P1-2 (round 2) : la regex précédente \b(ADD|Add)\b acceptait n'importe quelle
  // occurrence (ex: "added", "padded"). On exige désormais que ADD/Add apparaisse
  // en début de phrase (start of line OU après ". ") et soit suivi d'un mot
  // (instruction réelle, pas un fragment).
  PASS2_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass2 builder for roomType=${roomType ?? "fallback"} contains ADD/Add as imperative instruction`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      // Match: début de ligne ou après ". " puis "Add " ou "ADD " suivi d'un mot
      const imperativeAdd = /(^|[.\n]\s*)(ADD|Add)\s+\w+/m;
      expect(prompt, "ADD/Add must be in imperative position (start of sentence)").toMatch(imperativeAdd);
    });
  });
});

describe("G-PROMPT-B08 — DSLR_LINE en fin de chaque builder pass 1 (Sprint 6)", () => {
  // P1-3 (round 2) : on vérifie que DSLR apparaît dans les 400 derniers chars
  // (zone "fin de builder") pour empêcher un déplacement accidentel en début.
  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 builder for roomType=${roomType ?? "fallback"} contains DSLR descriptor in last 400 chars`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      const tail = prompt.slice(-400);
      expect(tail, "DSLR descriptor must be in the last 400 chars of the builder").toMatch(/DSLR/);
    });
  });
});

describe("G-PROMPT-B09 — EQUIPMENT_PRESERVATION couvre radiator/convector/vent/panel/boiler/water heater (Sprint 18, 23)", () => {
  // P1-4 (round 2) : élargir au-delà de "radiator". Sprint 18 ajoute radiateurs,
  // Sprint 23 ajoute water heater / boiler / electrical panel. On exige que
  // CHACUN des termes critiques soit présent dans chaque branche pass2.
  // P1-4 (round 2) : la spec PASS2_EQUIPMENT_V54 (lib/generation-pipeline.ts)
  // contient explicitement : radiators, convectors, heaters, vents, panels,
  // towel dryers. On exige la présence de CHACUN de ces 6 termes (avec
  // tolérance singulier/pluriel) pour bloquer toute suppression silencieuse.
  // Note : "boiler"/"water heater" sont mentionnés dans le contexte
  // describer (l. 68) mais hors EQUIPMENT_PRESERVATION pass2 — non testés ici.
  const REQUIRED_EQUIPMENT = [
    /\bradiators?\b/i,
    /\bconvectors?\b/i,
    /\bheaters?\b/i,
    /\bvents?\b/i,
    /\bpanels?\b/i,
    /\btowel dryers?\b/i,
  ];

  PASS2_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass2 builder for roomType=${roomType ?? "fallback"} preserves all wall equipment terms`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      REQUIRED_EQUIPMENT.forEach((re) => {
        expect(prompt, `missing equipment term ${re} in pass2 ${roomType ?? "fallback"}`).toMatch(re);
      });
    });
  });
});

describe("G-PROMPT-B10 — Outdoor pass 1 contient ANTI_INVENTION (Sprint 19)", () => {
  it("buildOutdoorSurfacesResponsesPrompt contains 'No new architectural elements'", () => {
    const prompt = buildOutdoorSurfacesResponsesPrompt(SAMPLE_SURFACE, "", "");
    expect(prompt.toLowerCase()).toMatch(/no new architectural elements/);
  });

  it("buildOutdoorFurnitureResponsesPrompt also contains anti-invention", () => {
    const prompt = buildOutdoorFurnitureResponsesPrompt(SAMPLE_FURNITURE, "", "");
    expect(prompt.toLowerCase()).toMatch(/no new architectural elements/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE D — input_fidelity
// ═══════════════════════════════════════════════════════════════════════

// v57: rollback Option 2 (décision 087e38b) — defaults to "high" universally
describe("G-PROMPT-D01 — tryOpenAIResponses default inputFidelity is 'high' (Session 36 v57)", () => {
  it("tryOpenAIResponses signature has default inputFidelity='high'", () => {
    expect(PIPELINE_SRC).toMatch(/inputFidelity:\s*InputFidelity\s*=\s*"high"/);
  });
});

// v57: clause supprimée par rollback Option 2 décision 087e38b — generatePass passe "high" uniformément
describe.skip("G-PROMPT-D02 — generatePass passes 'low' for pass 1 and 'high' for pass 2 (Session 36 v56)", () => {
  it("generatePass calls tryOpenAIResponses with pass-conditional fidelity", () => {
    expect(PIPELINE_SRC).toMatch(/pass\s*===\s*1\s*\?\s*"low"\s*:\s*"high"/);
  });
});

describe("G-PROMPT-D03 — iteration uses input_fidelity 'high' (Sprint 24)", () => {
  // P1-5 (round 2) : ancrer la vérification au CORPS de la fonction
  // tryOpenAIResponsesWithPrompt (iteration) au lieu d'un grep global. Si on
  // déplace high ailleurs (ex: pass2 par défaut), la gate doit toujours
  // détecter sa présence DANS la fonction iteration précisément.
  it("tryOpenAIResponsesWithPrompt body contains input_fidelity: 'high'", () => {
    // Extraction multiline du corps de la fonction (de la déclaration export
    // jusqu'à la prochaine déclaration export ou fin de fichier).
    const fnMatch = PIPELINE_SRC.match(
      /export\s+async\s+function\s+tryOpenAIResponsesWithPrompt[\s\S]*?(?=\n(?:export\s+(?:async\s+)?function|export\s+const|export\s+type|$))/
    );
    expect(fnMatch, "tryOpenAIResponsesWithPrompt function not found in pipeline source").not.toBeNull();
    const fnBody = fnMatch?.[0] ?? "";
    expect(fnBody).toMatch(/input_fidelity:\s*"high"/);
  });
});

describe("G-PROMPT-D04 — InputFidelity union type exporté", () => {
  it("InputFidelity type is declared as 'high' | 'low'", () => {
    expect(PIPELINE_SRC).toMatch(/export\s+type\s+InputFidelity\s*=\s*"high"\s*\|\s*"low"|export\s+type\s+InputFidelity\s*=\s*"low"\s*\|\s*"high"/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE F — SCHEMA STYLE_VARIANTS
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-F01 — STYLE_VARIANTS contient exactement 12 styles (Sprint 22)", () => {
  it("STYLE_VARIANTS has 12 keys", () => {
    expect(Object.keys(STYLE_VARIANTS).length).toBe(12);
  });
});

describe("G-PROMPT-F02 — chaque style a exactement 3 furnitureVariants", () => {
  Object.entries(STYLE_VARIANTS).forEach(([id, variants]) => {
    it(`${id}: 3 furnitureVariants`, () => {
      expect(variants.furnitureVariants.length).toBe(3);
    });
  });
});

describe("G-PROMPT-F03 — chaque style a exactement 3 accentPalettes", () => {
  Object.entries(STYLE_VARIANTS).forEach(([id, variants]) => {
    it(`${id}: 3 accentPalettes`, () => {
      expect(variants.accentPalettes.length).toBe(3);
    });
  });
});

describe("G-PROMPT-F04 — chaque furnitureVariant contient FOREGROUND (Sprint 14 spatial)", () => {
  Object.entries(STYLE_VARIANTS).forEach(([id, variants]) => {
    variants.furnitureVariants.forEach((variant, idx) => {
      it(`${id} variant #${idx} contains FOREGROUND`, () => {
        expect(variant).toContain("FOREGROUND");
      });
    });
  });
});

describe("G-PROMPT-F05 — aucun variant vide ou trop court", () => {
  Object.entries(STYLE_VARIANTS).forEach(([id, variants]) => {
    variants.furnitureVariants.forEach((variant, idx) => {
      it(`${id} variant #${idx} is non-empty and >= 200 chars`, () => {
        expect(variant.length).toBeGreaterThan(200);
      });
    });
    variants.accentPalettes.forEach((palette, idx) => {
      it(`${id} accentPalette #${idx} is non-empty`, () => {
        expect(palette.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

describe("G-PROMPT-F06 — IDs STYLE_VARIANTS = IDs STYLES (sans 'custom')", () => {
  it("Every STYLE id (except custom) has a STYLE_VARIANTS entry", () => {
    const variantIds = new Set(Object.keys(STYLE_VARIANTS));
    STYLES.forEach((style) => {
      if (style.id === "custom") return;
      expect(variantIds.has(style.id), `${style.id} missing from STYLE_VARIANTS`).toBe(true);
    });
  });

  it("Every STYLE_VARIANTS key has a matching STYLE id", () => {
    const styleIds = new Set(STYLES.map((s) => s.id));
    Object.keys(STYLE_VARIANTS).forEach((id) => {
      expect(styleIds.has(id), `${id} in STYLE_VARIANTS but not in STYLES`).toBe(true);
    });
  });
});
