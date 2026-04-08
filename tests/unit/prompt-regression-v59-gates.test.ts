/**
 * Prompt Regression Gates v59 — Catégorie I (override vs builder coherence),
 * J (action verbs strength), K (full room_type coverage), L (TEMPORARY vs PERMANENT split),
 * M (wall art positive coverage), N (narrow-room geometry gate).
 *
 * Spec : docs/ia/v59-prompt-regression-protocol.md
 * Owner : @ia (session 38, v59, audit Lucas Moreau production batch #231-235)
 *
 * Ces gates ont été ajoutées APRÈS la régression catastrophique v58 #234
 * (bathroom Scandinave 3.4/10 CAP 5 — open bar, vanity hallucinée sur
 * couloir 60cm, convecteur supprimé). Chaque gate est conçue pour FAIL
 * sur le code v58 et PASS sur v59.
 *
 * Principe directeur : les 48 gates existantes (A-H) vérifient la PRÉSENCE
 * de vocabulaire et la STRUCTURE, mais aucune ne vérifie la COHÉRENCE entre
 * sources de prompt (room-types.ts override vs builder inline directives).
 * C'est exactement le trou qui a laissé passer la contradiction v58
 * preservation-first (room-types.ts) + "Compact by default: ONE vanity 60cm"
 * (builder bathroom).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  PROMPT_VERSION,
  buildSurfacesResponsesPrompt,
  buildFurnitureResponsesPrompt,
} from "@/lib/generation-pipeline";

import { ROOM_TYPES, applyRoomTypeOverrides, getStyleMaterialHint } from "@/lib/room-types";
import { STYLES } from "@/components/StylePicker";

const ROOT = resolve(__dirname, "../..");
const PIPELINE_SRC = readFileSync(resolve(ROOT, "lib/generation-pipeline.ts"), "utf8");
const ROOM_TYPES_SRC = readFileSync(resolve(ROOT, "lib/room-types.ts"), "utf8");

// Sample style prompts
const SAMPLE_SURFACE = "Sample surface: white walls, oak floor, white ceiling, pendant light";
const SAMPLE_FURNITURE = "Sample furniture: sofa 230cm, coffee table 120cm";

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
  null,
];

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE I — OVERRIDE vs BUILDER COHERENCE
// ═══════════════════════════════════════════════════════════════════════
// Principe : les roomFurnitureOverride de lib/room-types.ts et les directives
// inline des builders de lib/generation-pipeline.ts doivent être COHÉRENTS.
// Un override "preservation-first" ne doit jamais cohabiter avec une directive
// builder "Compact by default: ONE vanity" qui contredit la préservation.

describe("G-PROMPT-I01 — bathroom builder has NO default furniture prescription (v59 Lucas #234)", () => {
  // Le builder bathroom NE DOIT PAS contenir de phrase du type
  // "Compact by default: ONE vanity 60cm" / "ONE basin by default".
  const FORBIDDEN_DEFAULTS = [
    /compact\s+by\s+default[^.]*vanity/i,
    /compact\s+by\s+default[^.]*basin/i,
    /by\s+default[:\s]+one\s+(vanity|basin|mirror|shower|tub)/i,
    /default[:\s]*\s*one\s+\d+cm\s+(vanity|basin|mirror)/i,
  ];

  it("bathroom pass 2 builder output contains no 'Compact by default' furniture prescription", () => {
    const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, "bathroom", "");
    FORBIDDEN_DEFAULTS.forEach((re) => {
      expect(prompt, `bathroom builder still contains forbidden default: ${re}`).not.toMatch(re);
    });
  });

  it("generation-pipeline.ts source contains no 'Compact by default' directive outside comments", () => {
    const codeOnly = PIPELINE_SRC
      .split("\n")
      .filter((line) => {
        const t = line.trim();
        return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
      })
      .join("\n");
    FORBIDDEN_DEFAULTS.forEach((re) => {
      expect(codeOnly, `generation-pipeline.ts still contains forbidden default: ${re}`).not.toMatch(re);
    });
  });
});

describe("G-PROMPT-I02 — preservation-first override is not contradicted by builder (v59)", () => {
  it("bathroom override in room-types.ts contains PRESERVATION-FIRST marker + Step 1/2/3", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    expect(override).toMatch(/PRESERVATION-FIRST/);
    expect(override).toMatch(/Step 1/i);
    expect(override).toMatch(/Step 2/i);
    expect(override).toMatch(/Step 3/i);
  });

  it("bathroom override contains narrow corridor geometry gate", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    expect(override).toMatch(/narrow\s+corridor|1\.5\s*m|less\s+than|closer\s+than/i);
  });

  it("bathroom override Step 1 (narrow) explicitly excludes wall-mounted furniture", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    expect(override).toMatch(/ADD nothing on the walls|no vanity[,.\s].*no mirror|no wall-mounted/i);
  });

  it("kitchen override also has preservation-first pattern", () => {
    const override = ROOM_TYPES.kitchen.roomFurnitureOverride;
    expect(override).toMatch(/preserve\s+all\s+existing/i);
    expect(override).toMatch(/Do\s+NOT\s+replace/i);
  });
});

describe("G-PROMPT-I03 — no dimensional default in preservation-first builders", () => {
  // Pour bathroom + kitchen (preservation-first), le builder NE DOIT PAS contenir
  // "ONE <item> <N>cm" en forme de default ("Compact by default: ONE vanity 60cm").
  const DIMENSIONAL_DEFAULT = /(^|\.\s*)(Compact\s+)?(by\s+default\s*[:]?|default\s*[:])\s*ONE\s+\w+\s+\d+\s*cm/i;

  ["bathroom", "kitchen"].forEach((roomId) => {
    it(`${roomId}: builder output contains no dimensional default prescription`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomId, "");
      expect(prompt, `${roomId} builder contains dimensional default`).not.toMatch(DIMENSIONAL_DEFAULT);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE J — ACTION VERBS STRENGTH
// ═══════════════════════════════════════════════════════════════════════
// Principe : les directives CLEANUP doivent utiliser des verbes d'action
// ("MUST be rendered empty", "REMOVE", "output must be") et non des verbes
// d'état ("stays empty", "remains empty", "keeps empty"). gpt-image-1.5
// interprète "stays" comme "reste dans son état actuel" — si l'input contient
// des personnes, "room stays empty of people" est lu comme "ne rajoute pas
// de personnes" au lieu de "rends-la vide".
// Origine : Lucas #233 — personnes et échelle pas retirées malgré v58 P0-3.

describe("G-PROMPT-J01 — CLEANUP uses strong action verb, not state verb (v59 Lucas #233)", () => {
  // Le CLEANUP_V53 doit contenir au moins une instance de verbe d'action fort
  const ACTION_VERBS_REQUIRED = [
    /\bMUST\s+be\s+rendered/i,
    /\bMUST\s+be\s+empty/i,
    /\bREMOVE\b/,
    /\boutput\s+MUST/i,
  ];

  // Et NE DOIT PAS contenir les patterns d'état faibles pour "empty"
  const FORBIDDEN_STATE_VERBS = [
    /room\s+stays\s+COMPLETELY\s+EMPTY/i,
    /room\s+remains\s+completely\s+empty/i,
    /room\s+stays\s+empty\s+of\s+people/i,
  ];

  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 ${roomType ?? "fallback"} contains at least one strong action verb in CLEANUP`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      const hasStrong = ACTION_VERBS_REQUIRED.some((re) => re.test(prompt));
      expect(hasStrong, `CLEANUP in ${roomType ?? "fallback"} has no strong action verb`).toBe(true);
    });

    it(`pass1 ${roomType ?? "fallback"} contains no weak 'stays empty' state verb`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      FORBIDDEN_STATE_VERBS.forEach((re) => {
        expect(prompt, `CLEANUP in ${roomType ?? "fallback"} uses forbidden weak state verb`).not.toMatch(re);
      });
    });
  });
});

describe("G-PROMPT-J02 — CLEANUP uses 'REMOVE' imperative at start of directive (v59)", () => {
  // La directive CLEANUP doit commencer par un impératif ("REMOVE ..." en majuscule)
  // pour maximiser l'attention du modèle sur l'action.
  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 ${roomType ?? "fallback"} contains 'REMOVE only these TEMPORARY' opening`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toMatch(/REMOVE\s+only\s+these\s+TEMPORARY/i);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE K — FULL ROOM_TYPE COVERAGE
// ═══════════════════════════════════════════════════════════════════════
// Principe : tout room_type défini dans ROOM_TYPES doit avoir un builder
// pass 1 ET un builder pass 2 qui produisent un prompt non-vide et contenant
// les constantes critiques (STRUCTURE LOCK, PASS2_PREAMBLE, EQUIPMENT).
// Empêche l'oubli silencieux d'un nouveau room_type.

describe("G-PROMPT-K01 — every indoor room_type in ROOM_TYPES has a working pass 1 builder", () => {
  const ALL_ROOM_IDS = Object.keys(ROOM_TYPES);

  it("ROOM_TYPES contains at least 10 indoor room types", () => {
    expect(ALL_ROOM_IDS.length).toBeGreaterThanOrEqual(10);
  });

  ALL_ROOM_IDS.forEach((roomId) => {
    it(`pass1 ${roomId}: non-empty prompt with STRUCTURE LOCK + CLEANUP`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomId, "");
      expect(prompt.length).toBeGreaterThan(200);
      expect(prompt).toContain("STRUCTURE LOCK");
      expect(prompt).toMatch(/REMOVE\s+only\s+these\s+TEMPORARY/i);
    });
  });
});

describe("G-PROMPT-K02 — every indoor room_type in ROOM_TYPES has a working pass 2 builder", () => {
  const ALL_ROOM_IDS = Object.keys(ROOM_TYPES);

  ALL_ROOM_IDS.forEach((roomId) => {
    it(`pass2 ${roomId}: non-empty prompt with PASS2_PREAMBLE + EQUIPMENT`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomId, "");
      expect(prompt.length).toBeGreaterThan(200);
      expect(prompt).toContain("Edit this photo of a finished room");
      // Equipment list must contain radiators AND electrical panels (v59 new)
      expect(prompt).toMatch(/\bradiators?\b/i);
      expect(prompt).toMatch(/electrical\s+panels?/i);
    });
  });
});

describe("G-PROMPT-K03 — snapshot coverage equals room_type count × indoor styles count", () => {
  // La couverture snapshot E01/E02 doit couvrir 11 room types × 12 styles = 132 chaque.
  // Si un nouveau room_type est ajouté, cette gate FAIL jusqu'à ce que le snapshot
  // soit régénéré et qu'un humain ait reviewed le diff.
  it("ROOM_TYPES has exactly 11 entries (if this changes, update snapshot coverage)", () => {
    expect(Object.keys(ROOM_TYPES).length).toBe(11);
  });

  it("STYLES (excluding custom) has exactly 12 entries", () => {
    const indoorStyles = STYLES.filter((s) => s.id !== "custom");
    expect(indoorStyles.length).toBe(12);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE L — TEMPORARY vs PERMANENT SPLIT
// ═══════════════════════════════════════════════════════════════════════
// Principe : CLEANUP doit distinguer clairement les éléments TEMPORAIRES
// (à retirer : cables au sol, échelles, seaux, personnes) des PERMANENTS
// (à préserver : panneau électrique, thermostat, prises encastrées).
// Origine : Lucas #235 — tableau électrique effacé en pass 1 car listé
// comme "junction boxes" dans CLEANUP v58 sans distinction.

describe("G-PROMPT-L01 — CLEANUP has TEMPORARY vs PERMANENT explicit split (v59 Lucas #235)", () => {
  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 ${roomType ?? "fallback"} CLEANUP contains PRESERVE directive for permanent equipment`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toMatch(/PRESERVE\s+all\s+PERMANENT/i);
    });

    it(`pass1 ${roomType ?? "fallback"} CLEANUP lists electrical panels in preservation set`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toMatch(/electrical\s+panels?/i);
    });

    it(`pass1 ${roomType ?? "fallback"} CLEANUP lists thermostats in preservation set`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toMatch(/\bthermostats?\b/i);
    });

    it(`pass1 ${roomType ?? "fallback"} CLEANUP lists REMOVE-side ladders (P0-3 v58 kept)`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toMatch(/\bladders?\b/i);
    });

    it(`pass1 ${roomType ?? "fallback"} CLEANUP lists REMOVE-side people (P0-3 v58 kept)`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      expect(prompt).toMatch(/\bpeople\b/i);
    });
  });
});

describe("G-PROMPT-L02 — junction boxes are NOT in the universal REMOVE list (v59 #235 fix)", () => {
  // v58 listait "junction boxes" en REMOVE — un tableau électrique peut être décrit
  // comme "junction box" et se faire effacer à tort. v59 : remove "loose cables",
  // "exposed pipes lying on floor", "open wiring" mais PAS "junction box" tout court.
  PASS1_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass1 ${roomType ?? "fallback"} does NOT REMOVE bare 'junction boxes'`, () => {
      const prompt = buildSurfacesResponsesPrompt(SAMPLE_SURFACE, roomType, "");
      // Cherche le pattern REMOVE ... junction box ... (dans la même sentence)
      // Acceptable : "REMOVE ... loose cables. PRESERVE ... junction box"
      // Interdit : "REMOVE ... junction boxes, ..."
      const removeSection = prompt.match(/REMOVE\s+only\s+these\s+TEMPORARY[^.]*?\./i);
      if (removeSection) {
        expect(
          removeSection[0],
          `REMOVE section still lists junction boxes: ${removeSection[0].slice(0, 200)}`
        ).not.toMatch(/junction\s+boxes?/i);
      }
    });
  });
});

describe("G-PROMPT-L03 — PASS2_EQUIPMENT includes electrical panels, fuse boxes, thermostats (v59 #235)", () => {
  // Pass 2 équivalent : la clause EQUIPMENT_PRESERVATION doit également contenir
  // les termes électriques pour que le modèle ne les retire pas en pass 2
  // si ils ont survécu à pass 1.
  PASS2_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass2 ${roomType ?? "fallback"} preserves electrical panels`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      expect(prompt).toMatch(/electrical\s+panels?/i);
    });

    it(`pass2 ${roomType ?? "fallback"} preserves thermostats`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      expect(prompt).toMatch(/\bthermostats?\b/i);
    });

    it(`pass2 ${roomType ?? "fallback"} preserves wall outlets / switches`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      expect(prompt).toMatch(/wall\s+outlets?|light\s+switches?/i);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE M — WALL ART POSITIVE COVERAGE
// ═══════════════════════════════════════════════════════════════════════
// Principe : la directive anti wall art doit être FORMULÉE POSITIVEMENT
// ("all decorative art stays freestanding") et non négativement
// ("no wall art" amorcerait le modèle à en générer).
// Origine : Lucas #235 — leopard wall art hallucinated.

describe("G-PROMPT-M01 — pass2 has positive wall-art coverage (v59 #235)", () => {
  PASS2_ROOM_BRANCHES.forEach((roomType) => {
    it(`pass2 ${roomType ?? "fallback"} contains positive 'freestanding or leans against' directive`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      expect(prompt).toMatch(/freestanding\s+or\s+leans?\s+against/i);
    });

    it(`pass2 ${roomType ?? "fallback"} mentions 'walls remain solid' (positive, not 'no wall art')`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      expect(prompt).toMatch(/walls?\s+remain\s+solid/i);
    });

    it(`pass2 ${roomType ?? "fallback"} does NOT use negative 'no wall art' phrasing`, () => {
      const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, roomType, "");
      // Pattern négatif amorçant interdit (trop direct, amorce le modèle)
      expect(prompt).not.toMatch(/\bno\s+wall\s+art\b/i);
      expect(prompt).not.toMatch(/\bno\s+framed\s+(prints|paintings)\b/i);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE N — NARROW-ROOM GEOMETRY GATE
// ═══════════════════════════════════════════════════════════════════════
// Principe : pour les pièces qui incluent du mobilier mural (bathroom vanity,
// kitchen cabinetry), le roomFurnitureOverride DOIT inclure une condition
// explicite "if room width > X / if standard size" pour éviter l'élargissement
// hallucinatoire sur des couloirs étroits.
// Origine : Lucas #234 — bathroom corridor 60cm → pièce élargie ~4x.

describe("G-PROMPT-N01 — bathroom override has narrow-corridor geometry gate (v59 #234)", () => {
  it("bathroom override explicitly checks room width before adding wall-mounted items", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    // Doit contenir : (1) une vérification de largeur, (2) une branche "si étroit", (3) une branche "si standard"
    expect(override, "missing width check").toMatch(/check\s+room\s+width|less\s+than|1\.5\s*m|narrow\s+corridor/i);
    expect(override, "missing narrow branch").toMatch(/Step\s+1|narrow\s+corridor|less\s+than/i);
    expect(override, "missing standard branch").toMatch(/Step\s+2|standard\s+bathroom|more\s+than\s+1\.5|wider\s+than/i);
  });

  it("bathroom override Step 2 vanity addition is CONDITIONAL (not default)", () => {
    const override = ROOM_TYPES.bathroom.roomFurnitureOverride;
    // Pattern : "ADD vanity ... ONLY if no vanity" ou "ONLY if the widest empty wall"
    expect(override).toMatch(/ONLY\s+if\s+no\s+vanity|ONLY\s+if\s+the\s+widest|ONLY\s+if\s+no\s+(mirror|sink)/i);
  });
});

describe("G-PROMPT-N02 — bathroom builder preserves passage width (v59 #234)", () => {
  it("bathroom pass2 builder explicitly enforces 'passage width stays identical'", () => {
    const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, "bathroom", "");
    expect(prompt).toMatch(/passage\s+width\s+stays\s+identical|distance\s+between\s+opposing\s+walls\s+is\s+IDENTICAL/i);
  });

  it("bathroom pass2 builder explicitly forbids widening / deepening / stretching", () => {
    const prompt = buildFurnitureResponsesPrompt(SAMPLE_FURNITURE, "bathroom", "");
    expect(prompt).toMatch(/do\s+not\s+widen|do\s+not\s+stretch/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE O — INVENTORY / CLEANUP alignment
// ═══════════════════════════════════════════════════════════════════════
// Principe : le system prompt de extractRoomInventory doit inclure un
// marqueur "TO REMOVE: ..." pour signaler les temporaires sans les décrire
// en détail — alignement avec CLEANUP qui demande leur retrait.
// Origine : Lucas #233 — l'inventaire décrivait "2 people standing in the
// room" ce qui contredisait CLEANUP "REMOVE any people".

describe("G-PROMPT-O01 — extractRoomInventory system prompt contains TO REMOVE marker (v59 #233)", () => {
  it("system prompt contains 'TO REMOVE' marker instruction", () => {
    // Lecture du source pour valider le system prompt (impossible à runtime sans API call)
    expect(PIPELINE_SRC).toMatch(/TO\s+REMOVE/);
  });

  it("system prompt asks for PERMANENT geometry only in main description", () => {
    expect(PIPELINE_SRC).toMatch(/PERMANENT\s+geometry/i);
  });

  it("system prompt explicitly signals temporary elements via TO REMOVE line, not in main description", () => {
    // Match multi-ligne non-greedy pour le bloc d'instruction qui contient BOTH
    // "PERMANENT geometry" et "TO REMOVE" (et "append ... marker" ou "at the END")
    const hasAlignment = /PERMANENT\s+geometry[\s\S]{0,1200}TO\s+REMOVE/i.test(PIPELINE_SRC);
    expect(hasAlignment, "extractRoomInventory system prompt must align PERMANENT + TO REMOVE marker").toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CATÉGORIE P — PROMPT_VERSION bump
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-P01 — PROMPT_VERSION is at least v59 (session 38 audit fix)", () => {
  it("PROMPT_VERSION starts with 'v' followed by a number >= 59", () => {
    expect(PROMPT_VERSION).toMatch(/^v\d+/);
    const num = parseInt(PROMPT_VERSION.replace(/^v/, ""), 10);
    expect(num, `PROMPT_VERSION=${PROMPT_VERSION} is below v59`).toBeGreaterThanOrEqual(59);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SANITY : baseline files loaded
// ═══════════════════════════════════════════════════════════════════════

describe("Meta — source files loaded for v59 gates", () => {
  it("generation-pipeline.ts source loaded", () => {
    expect(PIPELINE_SRC.length).toBeGreaterThan(1000);
  });
  it("room-types.ts source loaded", () => {
    expect(ROOM_TYPES_SRC.length).toBeGreaterThan(500);
  });
});

