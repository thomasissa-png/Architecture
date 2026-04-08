/**
 * BR-6 (session 38) — Crop section "Mes biens" : 3 bugs
 *
 * Rapport fondateur (3e remontée d'un même ensemble de bugs) :
 *   1. Le bouton "Recadrer" n'est visible que sur une image sur 2 (gated sur input_image_key
 *      qui manque sur la moitié des photos)
 *   2. Le modal affiche l'image AVANT au lieu de l'APRÈS (cropImageUrl = input_image_key)
 *   3. Impossible de rogner — seulement zoomer et déplacer (react-easy-crop utilise un
 *      paradigme pan+zoom, pas de sélection rectangulaire)
 *
 * Fix session 38 :
 *   - Frontend : gate sur `output_image_key`, passe l'URL output au modal
 *   - Backend : API crop écrit `output_image_key` + backup `original_output_key`
 *   - Backend : API uncrop restaure output (+ backward compat input legacy)
 *   - Modal : migration react-easy-crop → react-image-crop (sélection rectangulaire libre
 *     + presets aspect ratio Libre/1:1/4:3/16:9/3:2)
 *   - Dépendance : react-easy-crop désinstallé, remplacé par react-image-crop
 *
 * Stratégie de test :
 *   1. STATIC GATES — grep sur les 4 fichiers touchés pour verrouiller la shape du fix
 *   2. RUNTIME — vérifier le comportement de uncrop (restauration double : output + input legacy)
 *   3. PAS de test runtime sur CropModal lui-même (react-image-crop utilise canvas + DOM,
 *      impossible en JSDOM — le comportement visuel sera validé en E2E Playwright)
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const pageCode = readFileSync(join(process.cwd(), "app/mes-biens/[id]/page.tsx"), "utf-8");
const cropModalCode = readFileSync(join(process.cwd(), "components/CropModal.tsx"), "utf-8");
const cropApiCode = readFileSync(join(process.cwd(), "app/api/user/photos/[id]/crop/route.ts"), "utf-8");
const uncropApiCode = readFileSync(join(process.cwd(), "app/api/user/photos/[id]/uncrop/route.ts"), "utf-8");
const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/**
 * Strip comments (line + block) before regex analysis — les commentaires du fix
 * mentionnent intentionnellement les anti-patterns pour documenter la régression.
 */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

const pageExec = stripComments(pageCode);
const cropModalExec = stripComments(cropModalCode);
const cropApiExec = stripComments(cropApiCode);
const uncropApiExec = stripComments(uncropApiCode);

// =============================================================================
// BUG 1 — Bouton Recadrer gated sur output_image_key (pas input_image_key)
// =============================================================================

describe("BR-6 bug 1 — bouton Recadrer gated sur output_image_key", () => {
  it("U-BR6-001: le bouton Recadrer gate sur photo.output_image_key", () => {
    // Le bouton doit être conditionné par output_image_key (garanti présent sur
    // toutes les photos générées). Gated sur input_image_key = absent sur la
    // moitié des photos → bouton invisible.
    expect(pageExec).toMatch(/photo\.output_image_key\s*&&\s*\(\s*\n?\s*<button/);
  });

  it("U-BR6-002: le bouton Recadrer NE gate PLUS sur photo.input_image_key", () => {
    // Anti-pattern : `{photo.input_image_key && (<button>Recadrer)`
    // On cherche un bouton Recadrer directement suivant une gate input_image_key.
    const badPattern = /photo\.input_image_key\s*&&\s*\(\s*\n?\s*<button[\s\S]{0,500}Recadrer/;
    expect(pageExec).not.toMatch(badPattern);
  });
});

// =============================================================================
// BUG 2 — Modal reçoit l'URL de l'image OUTPUT, API update output_image_key
// =============================================================================

describe("BR-6 bug 2 — source image = output, API opère sur output_image_key", () => {
  it("U-BR6-100: setCropImageUrl utilise output_image_key (pas input_image_key)", () => {
    // Le handler du bouton Recadrer doit construire l'URL à partir d'output_image_key
    expect(pageExec).toMatch(/setCropImageUrl\([^)]*output_image_key/);
    // Anti-régression : pas d'setCropImageUrl avec input_image_key
    expect(pageExec).not.toMatch(/setCropImageUrl\([^)]*input_image_key/);
  });

  it("U-BR6-101: API /crop vérifie que photo.output_image_key existe avant d'opérer", () => {
    // Garde-fou : refuser le crop si pas de résultat généré (cas impossible en prod
    // car le bouton est gated, mais défense en profondeur côté serveur).
    expect(cropApiExec).toMatch(/photo\.output_image_key/);
  });

  it("U-BR6-102: API /crop UPDATE output_image_key (pas input_image_key)", () => {
    // Le SET doit porter sur output_image_key, pas input_image_key
    expect(cropApiExec).toMatch(/SET\s+output_image_key\s*=/);
    // Anti-régression : pas de SET input_image_key dans le SQL du crop
    expect(cropApiExec).not.toMatch(/SET\s+input_image_key\s*=/);
  });

  it("U-BR6-103: API /crop backup vers original_output_key (pas original_input_key)", () => {
    expect(cropApiExec).toMatch(/original_output_key\s*=\s*COALESCE\s*\(\s*original_output_key\s*,\s*output_image_key\s*\)/);
  });

  it("U-BR6-104: API /crop migration ADD COLUMN original_output_key", () => {
    expect(cropApiExec).toMatch(/ADD COLUMN IF NOT EXISTS\s+original_output_key/);
  });
});

// =============================================================================
// BUG 2b — API /uncrop restaure output (+ backward compat input legacy)
// =============================================================================

describe("BR-6 bug 2b — uncrop restaure output_image_key + legacy compat", () => {
  it("U-BR6-200: API /uncrop SELECT les deux colonnes (output + input legacy)", () => {
    expect(uncropApiExec).toMatch(/original_input_key/);
    expect(uncropApiExec).toMatch(/original_output_key/);
  });

  it("U-BR6-201: API /uncrop accepte la restauration si AU MOINS UN backup existe", () => {
    // Pattern : `if (!originalInputKey && !originalOutputKey)` → erreur
    // Avant le fix : `if (!originalKey)` sur `original_input_key` seulement
    expect(uncropApiExec).toMatch(/!originalInputKey\s*&&\s*!originalOutputKey/);
  });

  it("U-BR6-202: API /uncrop set output_image_key depuis original_output_key quand dispo", () => {
    // Le UPDATE dynamique doit inclure output_image_key quand originalOutputKey existe
    expect(uncropApiExec).toMatch(/output_image_key\s*=\s*\$/);
    expect(uncropApiExec).toMatch(/original_output_key\s*=\s*NULL/);
  });

  it("U-BR6-203: API /uncrop garde la backward compat input_image_key pour les photos legacy", () => {
    // Les photos cropées AVANT le fix BR-6 ont un original_input_key → doivent
    // être restaurables même après le fix
    expect(uncropApiExec).toMatch(/input_image_key\s*=\s*\$/);
    expect(uncropApiExec).toMatch(/original_input_key\s*=\s*NULL/);
  });
});

// =============================================================================
// BUG 3 — CropModal utilise react-image-crop (sélection rectangulaire libre)
// =============================================================================

describe("BR-6 bug 3 — CropModal rectangle selection réelle", () => {
  it("U-BR6-300: package.json dépend de react-image-crop", () => {
    const dep = packageJson.dependencies?.["react-image-crop"] ?? packageJson.devDependencies?.["react-image-crop"];
    expect(dep).toBeDefined();
  });

  it("U-BR6-301: react-easy-crop NE doit PLUS être dépendance production", () => {
    const dep = packageJson.dependencies?.["react-easy-crop"];
    expect(dep).toBeUndefined();
  });

  it("U-BR6-302: CropModal importe ReactCrop depuis react-image-crop (npm OU vendor path)", () => {
    // BR-6 mise à jour : depuis le commit vendoring (Replit ESM resolver bug),
    // l'import runtime vient de @/components/vendor/react-image-crop/index.js,
    // mais les types restent depuis "react-image-crop" (npm package).
    // Au moins UN des deux doit être présent.
    const npmRuntimeImport = /import\s+ReactCrop[\s\S]{0,200}from\s+["']react-image-crop["']/.test(cropModalExec);
    const vendorRuntimeImport = /import\s+ReactCrop[\s\S]{0,200}from\s+["']@\/components\/vendor\/react-image-crop\/index\.js["']/.test(cropModalExec);
    expect(npmRuntimeImport || vendorRuntimeImport, "CropModal doit importer ReactCrop depuis le package npm OU le vendor path").toBe(true);
    // Les types Crop / PixelCrop doivent toujours venir du package npm pour TypeScript
    expect(cropModalExec).toMatch(/import\s+type\s+\{[^}]*Crop[^}]*\}\s+from\s+["']react-image-crop["']/);
  });

  it("U-BR6-303: CropModal importe le CSS de react-image-crop (npm OU vendor path)", () => {
    // BR-6 mise à jour : le CSS peut venir du package npm OU du vendor (selon
    // le commit vendoring pour fix Replit ESM resolver).
    const npmCssImport = /import\s+["']react-image-crop\/dist\/ReactCrop\.css["']/.test(cropModalExec);
    const vendorCssImport = /import\s+["']@\/components\/vendor\/react-image-crop\/ReactCrop\.css["']/.test(cropModalExec);
    expect(npmCssImport || vendorCssImport, "CropModal doit importer le CSS depuis le package npm OU le vendor path").toBe(true);
  });

  it("U-BR6-304: CropModal n'importe PLUS react-easy-crop", () => {
    expect(cropModalExec).not.toMatch(/from\s+["']react-easy-crop["']/);
    expect(cropModalExec).not.toMatch(/import\s+Cropper\s+from\s+["']react-easy-crop["']/);
  });

  it("U-BR6-305: CropModal expose des presets d'aspect ratio (Libre/1:1/4:3/16:9/3:2)", () => {
    expect(cropModalExec).toMatch(/ASPECT_RATIOS/);
    expect(cropModalExec).toMatch(/"1:1"/);
    expect(cropModalExec).toMatch(/"4:3"/);
    expect(cropModalExec).toMatch(/"16:9"/);
    expect(cropModalExec).toMatch(/["']free["']|["']Libre["']/);
  });

  it("U-BR6-306: CropModal utilise onComplete pour capturer le PixelCrop final", () => {
    expect(cropModalExec).toMatch(/onComplete=/);
  });

  it("U-BR6-307: CropModal calcule le crop final via canvas (drawImage + toDataURL)", () => {
    expect(cropModalExec).toMatch(/getCroppedBase64/);
    expect(cropModalExec).toMatch(/drawImage/);
    expect(cropModalExec).toMatch(/toDataURL\(["']image\/jpeg["']/);
  });

  it("U-BR6-308: CropModal scale les coordonnées affichées vers les pixels naturels de la source", () => {
    // Le scale est critique : sans ça, un crop sur une image affichée 600x400
    // mais naturelle 2400x1600 produit une image 600x400 (perte de 75% de la résolution)
    expect(cropModalExec).toMatch(/scaleX/);
    expect(cropModalExec).toMatch(/scaleY/);
    expect(cropModalExec).toMatch(/naturalWidth/);
    expect(cropModalExec).toMatch(/naturalHeight/);
  });

  it("U-BR6-309: CropModal valide la taille minimale de la sélection (anti crop vide)", () => {
    // Garde-fou : refuser un crop < 10px pour éviter une image vide
    expect(cropModalExec).toMatch(/completedCrop\.width\s*<\s*10|minWidth/);
  });
});

// =============================================================================
// Tests de non-régression légers sur les chemins d'import
// =============================================================================

describe("BR-6 — sanity checks", () => {
  it("U-BR6-400: le fichier CropModal existe et est un composant default export", () => {
    expect(existsSync(join(process.cwd(), "components/CropModal.tsx"))).toBe(true);
    expect(cropModalCode).toMatch(/export default function CropModal/);
  });

  it("U-BR6-401: la page mes-biens importe toujours CropModal", () => {
    expect(pageCode).toMatch(/import\s+CropModal\s+from\s+["']@\/components\/CropModal["']/);
  });

  it("U-BR6-402: le handler du modal passe le titre 'Recadrer le visuel généré'", () => {
    // Le titre doit refléter que c'est le visuel généré, pas l'input
    expect(pageExec).toMatch(/title=["']Recadrer le visuel généré["']/);
  });

  it("U-BR6-403: le UserPhoto interface de page.tsx expose original_output_key", () => {
    expect(pageCode).toMatch(/original_output_key:\s*string\s*\|\s*null/);
  });
});
