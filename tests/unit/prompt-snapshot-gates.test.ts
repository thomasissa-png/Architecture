/**
 * Prompt Regression Gates — Catégorie E (snapshots prompts construits).
 *
 * Spec : docs/ia/prompt-regression-gates-spec.md (Catégorie E — 5 gates)
 * Owner : @qa (Partie 2 — snapshots)
 *
 * Ces tests snapshotent le prompt final construit par chaque builder pour
 * chaque combinaison (style × roomType) et pour chaque builder outdoor /
 * iteration. Toute modification d'un preamble, d'un DSLR descriptor, d'un
 * EQUIPMENT_PRESERVATION, ou d'un stylePrompt fait diff → review humain
 * obligatoire avant update (`npx vitest -u ...`).
 *
 * Périmètre :
 *   - E01 : 12 styles × 11 room types pass 1 (132 snapshots)
 *   - E02 : 12 styles × 11 room types pass 2 (132 snapshots)
 *   - E03 : 8 outdoor styles pass 1 (8 snapshots) — BLOQUANT (round 3 P2-G3 promotion)
 *   - E04 : 8 outdoor styles pass 2 (8 snapshots) — BLOQUANT (round 3 P2-G3 promotion)
 *   - E05 : 4 iteration builders (indoor furniture, outdoor furniture, adjust indoor, adjust outdoor) — BLOQUANT (round 3 P2-G3 promotion)
 *
 * Promotion BLOQUANT round 3 : un drift silencieux sur outdoor ou iteration
 * casse la prod aussi sûrement qu'un drift indoor. Aligné avec E01/E02.
 * Toute mise à jour de snapshot nécessite review humain (`npx vitest -u ...`).
 *
 * Total : 284 snapshots.
 *
 * Déterminisme : les builders contiennent `resolveChooseOne()` qui utilise
 * `Math.random()` pour tirer un variant `(choose one: A, B, C)`. On le mocke
 * en `() => 0` pour toujours prendre le PREMIER variant — snapshot stable.
 * Un changement de variant (ajout/suppression/réordonnancement) fait diff →
 * review humain obligatoire avant update.
 *
 * Reconstruction sans API : buildSurfacesResponsesPrompt(prompt, roomType, "")
 * retourne la string exacte envoyée à OpenAI. Aucun mock nécessaire.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

import {
  buildSurfacesResponsesPrompt,
  buildFurnitureResponsesPrompt,
  buildOutdoorSurfacesResponsesPrompt,
  buildOutdoorFurnitureResponsesPrompt,
} from "@/lib/generation-pipeline";

import {
  buildIterationFurnitureResponsesPrompt,
  buildIterationOutdoorFurnitureResponsesPrompt,
  buildAdjustResponsesPrompt,
  buildAdjustOutdoorResponsesPrompt,
} from "@/lib/iteration-prompt";

import { STYLES } from "@/components/StylePicker";
import { ROOM_TYPES, applyRoomTypeOverrides, getStyleMaterialHint } from "@/lib/room-types";
import { OUTDOOR_STYLES } from "@/lib/outdoor-styles";

// Math.random → 0 pour déterminisme snapshot (premier variant toujours choisi).
// Utilisation de beforeEach + directe assignation sur Math.random : vitest 4
// réinitialise les mocks entre tests par défaut, donc on ré-applique à chaque it().
const originalRandom = Math.random;
beforeEach(() => {
  Math.random = () => 0;
});

afterAll(() => {
  Math.random = originalRandom;
  vi.restoreAllMocks();
});

// 12 styles indoor (hors "custom")
const INDOOR_STYLES = STYLES.filter((s) => s.id !== "custom").sort((a, b) => a.id.localeCompare(b.id));

// 11 room types indoor — ordre stable (alphabetique)
const INDOOR_ROOM_IDS = Object.keys(ROOM_TYPES).sort();

// 8 outdoor styles
const OUTDOOR_STYLE_IDS = Object.keys(OUTDOOR_STYLES).sort();

/**
 * Reproduit la logique du caller (route.ts + pipeline.ts) pour obtenir le
 * prompt furniture final utilisé en passe 2.
 */
function getEffectiveFurniturePrompt(styleId: string, roomTypeId: string): string {
  const style = STYLES.find((s) => s.id === styleId)!;
  const { effectiveFurniturePrompt } = applyRoomTypeOverrides(
    style.surfacePrompt,
    style.furniturePrompt,
    roomTypeId,
  );
  const rt = ROOM_TYPES[roomTypeId];
  if (rt?.roomFurnitureOverride) {
    return `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`;
  }
  return effectiveFurniturePrompt;
}

// Reproduit la logique du caller pour obtenir le prompt surface final passe 1.
// hasDedicatedBuilder = kitchen/bathroom/wc/bedroom_*/entryway/laundry/cellar
// utilise la raw style surfacePrompt, sinon le concatenated.
const ROOMS_WITH_DEDICATED_BUILDERS = new Set([
  "kitchen",
  "bathroom",
  "wc",
  "bedroom_adults",
  "bedroom_children",
  "entryway",
  "laundry",
  "cellar",
]);

function getEffectiveSurfacePrompt(styleId: string, roomTypeId: string): string {
  const style = STYLES.find((s) => s.id === styleId)!;
  const hasDedicated = ROOMS_WITH_DEDICATED_BUILDERS.has(roomTypeId);
  const { effectiveSurfacePrompt } = applyRoomTypeOverrides(
    style.surfacePrompt,
    style.furniturePrompt,
    roomTypeId,
  );
  return hasDedicated ? style.surfacePrompt.trim() : effectiveSurfacePrompt;
}

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-E01 — Pass 1 snapshots (indoor)
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-E01 — Pass 1 built prompts (indoor)", () => {
  INDOOR_STYLES.forEach((style) => {
    INDOOR_ROOM_IDS.forEach((roomId) => {
      it(`pass1: ${style.id} × ${roomId}`, () => {
        const surfacePrompt = getEffectiveSurfacePrompt(style.id, roomId);
        const built = buildSurfacesResponsesPrompt(surfacePrompt, roomId, "");
        expect(built).toMatchSnapshot();
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-E02 — Pass 2 snapshots (indoor)
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-E02 — Pass 2 built prompts (indoor)", () => {
  INDOOR_STYLES.forEach((style) => {
    INDOOR_ROOM_IDS.forEach((roomId) => {
      it(`pass2: ${style.id} × ${roomId}`, () => {
        const furniturePrompt = getEffectiveFurniturePrompt(style.id, roomId);
        const built = buildFurnitureResponsesPrompt(furniturePrompt, roomId, "");
        expect(built).toMatchSnapshot();
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-E03 — Pass 1 snapshots (outdoor)
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-E03 — Pass 1 built prompts (outdoor)", () => {
  OUTDOOR_STYLE_IDS.forEach((styleId) => {
    it(`outdoor pass1: ${styleId}`, () => {
      const style = OUTDOOR_STYLES[styleId];
      const built = buildOutdoorSurfacesResponsesPrompt(style.surfacePrompt, "", "");
      expect(built).toMatchSnapshot();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-E04 — Pass 2 snapshots (outdoor)
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-E04 — Pass 2 built prompts (outdoor)", () => {
  OUTDOOR_STYLE_IDS.forEach((styleId) => {
    it(`outdoor pass2: ${styleId}`, () => {
      const style = OUTDOOR_STYLES[styleId];
      const built = buildOutdoorFurnitureResponsesPrompt(style.furniturePrompt, "", "");
      expect(built).toMatchSnapshot();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-E05 — Iteration prompts
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-E05 — Iteration built prompts", () => {
  it("iteration indoor furniture — living_room, one modification", () => {
    const built = buildIterationFurnitureResponsesPrompt(
      "dummy",
      ["Add a reading chair near the window"],
      { roomType: "living_room", allowWallMounted: false, width: 1536, height: 1024 },
    );
    expect(built).toMatchSnapshot();
  });

  it("iteration outdoor furniture — one modification", () => {
    const built = buildIterationOutdoorFurnitureResponsesPrompt("dummy", [
      "Add a wooden bench against the wall",
    ]);
    expect(built).toMatchSnapshot();
  });

  it("adjust indoor — kitchen context", () => {
    const built = buildAdjustResponsesPrompt(
      "enlever le bol de fruits",
      "Remove the fruit bowl from the counter, fill with countertop texture",
      { roomType: "kitchen", allowWallMounted: false },
    );
    expect(built).toMatchSnapshot();
  });

  it("adjust outdoor — one change", () => {
    const built = buildAdjustOutdoorResponsesPrompt(
      "enlever le parasol",
      "Remove the umbrella, fill with ground and sky texture",
    );
    expect(built).toMatchSnapshot();
  });
});
