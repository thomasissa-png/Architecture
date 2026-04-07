/**
 * Prompt Regression Gates — Catégorie A (vocabulaire interdit) + G (sync StylePicker ≡ resolver).
 *
 * Spec : docs/ia/prompt-regression-gates-spec.md
 * Owner : @ia (Partie 1 — gates "simples" grep/string-based)
 *
 * Les gates BLOQUANT empêchent toute régression silencieuse sur les prompts gpt-image-1.5.
 * Chaque gate référence un bug historique factuel (Sprint XX ou Session YY).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { STYLES } from "@/components/StylePicker";
import { STYLE_VARIANTS } from "@/lib/style-variants";

// Lecture brute des fichiers source pour les gates qui ciblent le code (pas seulement les valeurs runtime).
const ROOT = resolve(__dirname, "../..");
const PIPELINE_SRC = readFileSync(resolve(ROOT, "lib/generation-pipeline.ts"), "utf8");
const STYLE_RESOLVER_SRC = readFileSync(resolve(ROOT, "lib/style-resolver.ts"), "utf8");
const STYLE_VARIANTS_SRC = readFileSync(resolve(ROOT, "lib/style-variants.ts"), "utf8");

// ─── Charge le résolveur sans alias dynamique pour comparaison G ──────
// Note : on ré-importe via require pour éviter problèmes ESM/CJS dans vitest.
import * as styleResolver from "@/lib/style-resolver";

// Helper : récupère la string surfacePrompt du resolver pour un style donné
function getResolverPrompts(styleId: string): { surfacePrompt: string; furniturePrompt: string } | null {
  const all = styleResolver.getAllIndoorStyles();
  const found = all.find((s) => s.id === styleId);
  return found ? { surfacePrompt: found.surfacePrompt, furniturePrompt: found.furniturePrompt } : null;
}

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE A — VOCABULAIRE INTERDIT
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-A01 — no 'vault beams' or 'structural ribs' outside Mediterranean/Industrial (Sprint 23 / v55 P0-B)", () => {
  // mediterranean & industrial conservent une clause conditionnelle légitime.
  const ALLOWED = new Set(["mediterranean", "industrial"]);

  STYLES.filter((s) => !ALLOWED.has(s.id)).forEach((style) => {
    it(`${style.id}: surfacePrompt does not contain 'vault beams' or 'structural ribs'`, () => {
      expect(style.surfacePrompt).not.toMatch(/vault beams|structural ribs/i);
    });
  });
});

describe("G-PROMPT-A02 — no 'curtains/drapes (noun)/sheer linen' in any style prompt (Sprint 12, Session 32)", () => {
  // Cible le vocabulaire window-treatment (curtain, drapes-noun, drapery, sheer linen).
  // Le verbe "draped over" (sheepskin draped, throw draped) reste autorisé — c'est un usage
  // valide pour les jets/textiles posés sur du mobilier.
  const FORBIDDEN = [
    /\bcurtains?\b/i,
    /\bcurtained\b/i,
    /\bdrapes\b/i,
    /\bdrapery\b/i,
    /\bdraperies\b/i,
    /sheer linen/i,
  ];

  STYLES.forEach((style) => {
    it(`${style.id}: surfacePrompt + furniturePrompt are clean`, () => {
      const both = `${style.surfacePrompt} ${style.furniturePrompt}`;
      FORBIDDEN.forEach((re) => {
        expect(both).not.toMatch(re);
      });
    });
  });

  it("STYLE_VARIANTS furnitureVariants are clean", () => {
    Object.entries(STYLE_VARIANTS).forEach(([id, variants]) => {
      variants.furnitureVariants.forEach((variant, idx) => {
        FORBIDDEN.forEach((re) => {
          expect(variant, `${id} variant ${idx} matches ${re}`).not.toMatch(re);
        });
      });
    });
  });
});

describe("G-PROMPT-A03 — no explicit 'window'/'doorway' positive mention in style prompts (Sprint 12)", () => {
  // Le mot "windows" est autorisé dans builders (PASS1_PREAMBLE) mais INTERDIT dans stylePrompts
  // car même négatif il amorce l'hallucination.
  STYLES.forEach((style) => {
    it(`${style.id}: surfacePrompt + furniturePrompt do not mention windows/doorway`, () => {
      const both = `${style.surfacePrompt} ${style.furniturePrompt}`;
      expect(both).not.toMatch(/\bwindows?\b/i);
      expect(both).not.toMatch(/\bdoorway/i);
    });
  });
});

describe("G-PROMPT-A04 — no uppercase 'TRANSFORM' verb in builders (Sprint 11)", () => {
  it("generation-pipeline.ts does not contain 'TRANSFORM' as instruction", () => {
    // TRANSFORM en majuscules est l'instruction problématique (Sprint 11).
    // On filtre les commentaires/historique (lignes commençant par //, *, ou contenant "Sprint").
    const codeOnly = PIPELINE_SRC
      .split("\n")
      .filter((line) => !line.trim().match(/^(\/\/|\*|\/\*)/))
      .join("\n");
    expect(codeOnly).not.toMatch(/\bTRANSFORM\b/);
  });
});

describe("G-PROMPT-A05 — no 'pixel-identical' or 'pixel identical' in builders (Sprint 17)", () => {
  it("generation-pipeline.ts does not contain 'pixel identical' or 'pixel-identical'", () => {
    expect(PIPELINE_SRC).not.toMatch(/pixel[-\s]identical/i);
  });
});

describe("G-PROMPT-A06 — no 'smooth white ceiling' (Sprint 16)", () => {
  STYLES.forEach((style) => {
    it(`${style.id}: surfacePrompt does not contain 'smooth white ceiling'`, () => {
      expect(style.surfacePrompt).not.toMatch(/smooth white ceiling/i);
    });
  });

  it("generation-pipeline.ts builders do not contain 'smooth white ceiling'", () => {
    expect(PIPELINE_SRC).not.toMatch(/smooth white ceiling/i);
  });
});

describe("G-PROMPT-A07 — no grain / vignetting (founder preference, Session 33)", () => {
  const FORBIDDEN = [
    /\bfilm grain\b/i,
    /\bsensor grain\b/i,
    /\bISO 200\b/,
    /\bvignetting\b/i,
    /\bvignette\b/i,
  ];

  STYLES.forEach((style) => {
    it(`${style.id}: no grain/vignette markers`, () => {
      const both = `${style.surfacePrompt} ${style.furniturePrompt}`;
      FORBIDDEN.forEach((re) => {
        expect(both).not.toMatch(re);
      });
    });
  });

  it("generation-pipeline.ts builders contain no grain/vignette directives", () => {
    // Filtre commentaires (les Sprints d'historique mentionnent ces termes légitimement).
    const codeOnly = PIPELINE_SRC
      .split("\n")
      .filter((line) => {
        const t = line.trim();
        return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
      })
      .join("\n");

    FORBIDDEN.forEach((re) => {
      expect(codeOnly).not.toMatch(re);
    });
  });
});

describe("G-PROMPT-A08 — no 'preserve existing floor material' (Sprint 16)", () => {
  STYLES.forEach((style) => {
    it(`${style.id}: surfacePrompt does not say 'preserve existing floor material'`, () => {
      expect(style.surfacePrompt).not.toMatch(/preserv(e|ing) (the )?existing floor material/i);
    });
  });
});

describe("G-PROMPT-A09 — no 'preserve existing ceiling light' in surfacePrompts (Sprint 16)", () => {
  STYLES.forEach((style) => {
    it(`${style.id}: surfacePrompt does not say 'preserve existing ceiling light'`, () => {
      expect(style.surfacePrompt).not.toMatch(/preserv(e|ing) (the )?existing ceiling light/i);
    });
  });
});

describe("G-PROMPT-A10 — no competitor model names in style prompts (founder pref)", () => {
  const COMPETITORS = [/\bMidjourney\b/i, /\bReplicate\b/i, /\bDALL[-\s]?E\b/i, /\bSDXL\b/i, /\bFlux Depth\b/i, /\bStable Diffusion\b/i];
  STYLES.forEach((style) => {
    it(`${style.id}: prompts do not mention competitor models`, () => {
      const both = `${style.surfacePrompt} ${style.furniturePrompt}`;
      COMPETITORS.forEach((re) => {
        expect(both).not.toMatch(re);
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE G — SYNCHRONISATION StylePicker ≡ style-resolver
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-G01 — STYLES.length === 12 and INDOOR_STYLES has 12 keys (Sprint 22)", () => {
  it("StylePicker exports exactly 12 styles", () => {
    expect(STYLES.length).toBe(12);
  });

  it("style-resolver INDOOR_STYLES has 12 entries", () => {
    expect(styleResolver.getAllIndoorStyles().length).toBe(12);
  });
});

describe("G-PROMPT-G02 — IDs identical between StylePicker and style-resolver", () => {
  it("Every STYLE id has a matching key in INDOOR_STYLES", () => {
    const resolverIds = new Set(styleResolver.getAllIndoorStyles().map((s) => s.id));
    STYLES.forEach((style) => {
      expect(resolverIds.has(style.id), `${style.id} missing in style-resolver`).toBe(true);
    });
  });

  it("style-resolver has no extra IDs", () => {
    const styleIds = new Set(STYLES.map((s) => s.id));
    styleResolver.getAllIndoorStyles().forEach((s) => {
      expect(styleIds.has(s.id), `${s.id} in resolver but not in StylePicker`).toBe(true);
    });
  });
});

describe("G-PROMPT-G03 — surfacePrompt identical between StylePicker and style-resolver", () => {
  STYLES.forEach((style) => {
    it(`${style.id}: surfacePrompt matches`, () => {
      const resolved = getResolverPrompts(style.id);
      expect(resolved).not.toBeNull();
      expect(resolved?.surfacePrompt).toBe(style.surfacePrompt);
    });
  });
});

describe("G-PROMPT-G04 — furniturePrompt non-empty and present in both StylePicker and style-resolver", () => {
  // Contrainte réaliste : les 2 fichiers utilisent des FORMATS différents pour le même
  // style (StylePicker = templated `(choose one: ...)`, resolver = forme aplatie).
  // C'est intentionnel — voir docs/ia/prompt-regression-gates-spec.md.
  // Le strict equality check est délégué à @qa via les snapshots de catégorie E.
  // Cette gate vérifie uniquement que les 2 versions existent, sont non-vides,
  // et dépassent un seuil de longueur cohérent (>500 chars).
  STYLES.forEach((style) => {
    it(`${style.id}: furniturePrompt non-empty in StylePicker AND resolver`, () => {
      const resolved = styleResolver.getStyleById(style.id, false);
      expect(resolved).not.toBeNull();
      expect(style.furniturePrompt.length).toBeGreaterThan(500);
      expect(resolved?.furniturePrompt.length).toBeGreaterThan(500);
    });
  });
});

// ─── Sanity meta-check : les sources lues ne sont pas vides ─────────────
describe("Meta — source files loaded", () => {
  it("pipeline.ts source loaded", () => {
    expect(PIPELINE_SRC.length).toBeGreaterThan(1000);
  });
  it("style-resolver.ts source loaded", () => {
    expect(STYLE_RESOLVER_SRC.length).toBeGreaterThan(1000);
  });
  it("style-variants.ts source loaded", () => {
    expect(STYLE_VARIANTS_SRC.length).toBeGreaterThan(1000);
  });
});
