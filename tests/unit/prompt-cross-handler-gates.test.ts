/**
 * Prompt Regression Gates — Catégorie H (cross-handler propagation).
 *
 * Spec : docs/ia/prompt-regression-gates-spec.md (Catégorie H — 4 gates)
 * Owner : @qa (Partie 2)
 *
 * Ces tests verrouillent la REGLE PROPAGATION CROSS-HANDLER (CLAUDE.md) :
 * toute correction sur un handler de fetch/réseau DOIT être propagée à TOUS
 * les handlers voisins du même fichier. Les régressions silencieuses viennent
 * toujours de fixes non propagés.
 *
 * Cible historique : session 35 Pipeline B audit #196 (v55 P0-A) — le fix
 * du roomFurnitureOverride avait été appliqué dans lib/generation-pipeline.ts
 * mais pas dans app/api/generate/route.ts, provoquant un salon au lieu d'une
 * salle à manger en production.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readdirSync, statSync } from "node:fs";

const ROOT = resolve(__dirname, "../..");

const ROUTE_SRC = readFileSync(resolve(ROOT, "app/api/generate/route.ts"), "utf8");
const PIPELINE_SRC = readFileSync(resolve(ROOT, "lib/generation-pipeline.ts"), "utf8");

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-H01 — route.ts ≡ pipeline.ts bloc roomFurnitureOverride
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-H01 — route.ts and pipeline.ts have mirrored 'if (rt?.roomFurnitureOverride)' block (v55 P0-A)", () => {
  it("both files contain the if (rt?.roomFurnitureOverride) block", () => {
    expect(ROUTE_SRC).toMatch(/if\s*\(\s*rt\?\.roomFurnitureOverride\s*\)/);
    expect(PIPELINE_SRC).toMatch(/if\s*\(\s*rt\?\.roomFurnitureOverride\s*\)/);
  });

  it("both files call getStyleMaterialHint in the override branch", () => {
    // Pattern : `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`
    const pattern = /\$\{rt\.roomFurnitureOverride\}\s*\$\{getStyleMaterialHint\(styleId\)\}/;
    expect(ROUTE_SRC).toMatch(pattern);
    expect(PIPELINE_SRC).toMatch(pattern);
  });

  it("both files declare the rt variable from ROOM_TYPES", () => {
    // Pattern : `const rt = roomType ? ROOM_TYPES[roomType] : null;`
    const pattern = /const\s+rt\s*=\s*roomType\s*\?\s*ROOM_TYPES\[roomType\]\s*:\s*null/;
    expect(ROUTE_SRC).toMatch(pattern);
    expect(PIPELINE_SRC).toMatch(pattern);
  });

  it("both files fall back to effectiveFurniturePrompt when override is empty", () => {
    // Pattern : `} else { trimmedFurniture = effectiveFurniturePrompt; }`
    const pattern = /else\s*\{\s*trimmedFurniture\s*=\s*effectiveFurniturePrompt\s*;?\s*\}/;
    expect(ROUTE_SRC).toMatch(pattern);
    expect(PIPELINE_SRC).toMatch(pattern);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-H02 — ROOMS_WITH_DEDICATED_BUILDERS identical between files
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-H02 — ROOMS_WITH_DEDICATED_BUILDERS list is identical across files", () => {
  /**
   * Extrait la liste inline des room IDs dedicated depuis une source.
   * Retourne un Set<string> trié stable.
   */
  function extractDedicatedList(src: string): Set<string> {
    const match = src.match(/ROOMS_WITH_DEDICATED_BUILDERS\s*=\s*\[([^\]]+)\]/);
    if (!match) throw new Error("ROOMS_WITH_DEDICATED_BUILDERS not found");
    return new Set(
      match[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean),
    );
  }

  it("route.ts defines ROOMS_WITH_DEDICATED_BUILDERS", () => {
    expect(() => extractDedicatedList(ROUTE_SRC)).not.toThrow();
  });

  it("pipeline.ts defines ROOMS_WITH_DEDICATED_BUILDERS", () => {
    expect(() => extractDedicatedList(PIPELINE_SRC)).not.toThrow();
  });

  it("both files have the exact same dedicated room list", () => {
    const routeList = extractDedicatedList(ROUTE_SRC);
    const pipelineList = extractDedicatedList(PIPELINE_SRC);
    expect([...routeList].sort()).toEqual([...pipelineList].sort());
  });

  it("dedicated list contains the 8 expected entries (kitchen, bathroom, wc, bedroom_adults/children, entryway, laundry, cellar)", () => {
    const routeList = extractDedicatedList(ROUTE_SRC);
    const expected = new Set([
      "kitchen",
      "bathroom",
      "wc",
      "bedroom_adults",
      "bedroom_children",
      "entryway",
      "laundry",
      "cellar",
    ]);
    expect([...routeList].sort()).toEqual([...expected].sort());
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-H03 — Unique image model : gpt-image-1.5 only (no gpt-image-1 nor DALL-E)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Walk récursif pour lister les fichiers de code (.ts, .tsx, .js, .jsx) sous un root.
 * Exclut : node_modules, .next, .replit, tests/, __snapshots__, audit-data-*.
 */
function walkCodeFiles(rootDir: string, limitDirs: string[]): string[] {
  const result: string[] = [];
  const IGNORE_DIRS = new Set([
    "node_modules",
    ".next",
    ".git",
    "tests",
    "__snapshots__",
    ".turbo",
    "dist",
    "build",
    ".vercel",
    "public",
    "docs",
    "agents",
    ".claude",
    "scripts",
  ]);
  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry)) continue;
      if (entry.startsWith("audit-data")) continue;
      const full = resolve(dir, entry);
      let s;
      try {
        s = statSync(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) {
        result.push(full);
      }
    }
  }
  for (const d of limitDirs) {
    walk(resolve(rootDir, d));
  }
  return result;
}

/**
 * Vérifie qu'un pattern n'apparaît PAS en dehors de commentaires et chaînes
 * de constantes de version (PROMPT_VERSION, CHANGELOG).
 *
 * Ignore :
 *   - lignes commençant par // ou * (comment block)
 *   - lignes contenant les marqueurs de version / changelog
 *   - lignes de documentation inline (ex: `// NE PAS utiliser gpt-image-1`)
 */
function findForbiddenMatches(src: string, pattern: RegExp): string[] {
  const lines = src.split("\n");
  const hits: string[] = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    // Skip comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
      return;
    }
    // Skip PROMPT_VERSION string constants and CHANGELOG entries
    if (/PROMPT_VERSION|CHANGELOG|DEPRECATED|Sprint\s+\d+|Session\s+\d+/i.test(line)) {
      return;
    }
    if (pattern.test(line)) {
      hits.push(`line ${idx + 1}: ${trimmed.slice(0, 150)}`);
    }
  });
  return hits;
}

// Scope H03/H04 : code logique de génération uniquement (pas les pages marketing/légales
// qui peuvent référencer légitimement d'anciens modèles dans leur texte descriptif).
// Si du texte legal/marketing est obsolète → finding séparé dans docs/qa/prompt-gates-coverage.md.
const PROD_GENERATION_DIRS = ["app/api", "lib"];

describe("G-PROMPT-H03 — No 'gpt-image-1' without '.5' in production code (founder pref 2026-04-04)", () => {
  const PROD_FILES = walkCodeFiles(ROOT, PROD_GENERATION_DIRS);

  it("scans at least 10 production generation files", () => {
    expect(PROD_FILES.length).toBeGreaterThanOrEqual(10);
  });

  it("no production file contains 'gpt-image-1' (without '.5') outside comments", () => {
    // Pattern : gpt-image-1 suivi d'autre chose qu'un `.` ou d'un chiffre
    // (gpt-image-1.5 est OK, gpt-image-1 tout seul est interdit)
    const forbidden = /gpt-image-1(?![.\d])/;
    const violations: string[] = [];
    for (const file of PROD_FILES) {
      const src = readFileSync(file, "utf8");
      const hits = findForbiddenMatches(src, forbidden);
      if (hits.length > 0) {
        violations.push(`${file.replace(ROOT + "/", "")}\n  ${hits.join("\n  ")}`);
      }
    }
    expect(violations, `Files with 'gpt-image-1' (non-.5):\n${violations.join("\n")}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G-PROMPT-H04 — No Flux / SDXL / DALL-E / Replicate / Stable Diffusion imports
// ═══════════════════════════════════════════════════════════════════════

describe("G-PROMPT-H04 — No Flux / SDXL / DALL-E / Replicate fallback in prod code", () => {
  const PROD_FILES = walkCodeFiles(ROOT, PROD_GENERATION_DIRS);

  const FORBIDDEN_IMPORTS = [
    /from\s+["']replicate["']/,
    /require\s*\(\s*["']replicate["']\s*\)/,
    /from\s+["']flux-depth/,
    /from\s+["']@black-forest-labs\//,
  ];

  const FORBIDDEN_API_CALLS = [
    /\bdall-?e-?[23]\b/i,
    /\bflux[-\s]?depth[-\s]?pro\b/i,
    /\bstable[-\s]?diffusion[-\s]?xl\b/i,
    /\bSDXL\b/,
  ];

  it("no production file imports 'replicate' or flux packages", () => {
    const violations: string[] = [];
    for (const file of PROD_FILES) {
      const src = readFileSync(file, "utf8");
      for (const re of FORBIDDEN_IMPORTS) {
        const hits = findForbiddenMatches(src, re);
        if (hits.length > 0) {
          violations.push(`${file.replace(ROOT + "/", "")}: ${re.source}\n  ${hits.join("\n  ")}`);
        }
      }
    }
    expect(violations, `Forbidden imports:\n${violations.join("\n")}`).toEqual([]);
  });

  it("no production file uses DALL-E / Flux Depth / SDXL as runtime instruction (comments OK)", () => {
    const violations: string[] = [];
    for (const file of PROD_FILES) {
      const src = readFileSync(file, "utf8");
      for (const re of FORBIDDEN_API_CALLS) {
        const hits = findForbiddenMatches(src, re);
        if (hits.length > 0) {
          violations.push(`${file.replace(ROOT + "/", "")}: ${re.source}\n  ${hits.join("\n  ")}`);
        }
      }
    }
    expect(violations, `Forbidden fallback model references:\n${violations.join("\n")}`).toEqual([]);
  });
});
