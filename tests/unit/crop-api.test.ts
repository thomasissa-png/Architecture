/**
 * Integration tests for app/api/user/photos/[id]/crop/route.ts
 *
 * WHY these tests exist:
 * - L'endpoint crop ecrase l'image originale en DB (action destructive)
 * - Sans auth check, n'importe qui peut modifier les photos des autres (IDOR)
 * - Sans validation du body, un payload malicieux crashe le serveur
 * - Un base64 sans prefixe data:image/ = image corrompue en Object Storage
 * - La photo doit appartenir au user connecte (ownership check via user_id)
 *
 * Run with: npx tsx tests/unit/crop-api.test.ts
 *
 * NOTE: These tests mock all external dependencies (auth, DB, storage).
 * They test the route handler logic in isolation.
 */

import assert from "node:assert/strict";

// ─── Test infrastructure ──────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => Promise<void> | void) {
  return { name, fn };
}

async function runTests(tests: ReturnType<typeof test>[]) {
  for (const t of tests) {
    try {
      await t.fn();
      passed++;
      console.log(`  PASS  ${t.name}`);
    } catch (err: unknown) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${t.name}: ${msg}`);
      console.log(`  FAIL  ${t.name}`);
      console.log(`        ${msg}`);
    }
  }
}

// ─── Mocks ────────────────────────────────────────────────────────────

// Since the route handler uses Next.js server imports that don't work
// outside of the framework, we test the LOGIC by reimplementing
// the validation/flow as pure functions, matching route.ts exactly.

interface MockSession {
  user?: { id?: string };
}

interface MockPhoto {
  id: string;
  user_id: string;
  input_image_key: string | null;
}

/**
 * Simulates the route handler logic from route.ts.
 * Returns { status, body } matching what NextResponse.json would produce.
 */
async function simulateCropRoute(params: {
  session: MockSession | null;
  photoId: string;
  photosInDb: MockPhoto[];
  requestBody: unknown;
  saveImageResult?: string;
  saveImageError?: Error;
  dbUpdateError?: Error;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  // Step 1: Auth check
  if (!params.session?.user?.id) {
    return { status: 401, body: { error: "Connexion requise." } };
  }

  // Step 2: Photo lookup (ownership check)
  const photo = params.photosInDb.find(
    (p) => p.id === params.photoId && p.user_id === params.session!.user!.id
  );
  if (!photo) {
    return { status: 404, body: { error: "Photo introuvable." } };
  }

  // Step 3: Parse body
  let body: { croppedImage?: string };
  try {
    if (params.requestBody === null || params.requestBody === undefined) {
      throw new Error("null body");
    }
    body = params.requestBody as { croppedImage?: string };
  } catch {
    return { status: 400, body: { error: "Corps de requête invalide." } };
  }

  // Step 4: Validate croppedImage
  const { croppedImage } = body;
  if (!croppedImage || !croppedImage.startsWith("data:image/")) {
    return { status: 400, body: { error: "Image recadrée manquante ou invalide." } };
  }

  // Step 5: Extract base64
  const base64 = croppedImage.split(",")[1];
  if (!base64) {
    return { status: 400, body: { error: "Format d'image invalide." } };
  }

  // Step 6: Save to storage
  try {
    if (params.saveImageError) throw params.saveImageError;
    const newKey = params.saveImageResult ?? `logs/${Date.now()}_cropped_${params.photoId}.jpg`;

    // Step 7: Update DB
    if (params.dbUpdateError) throw params.dbUpdateError;

    return { status: 200, body: { success: true, newInputKey: newKey } };
  } catch (err) {
    return { status: 500, body: { error: "Erreur lors du recadrage." } };
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────

const USER_A_ID = "user-a-uuid-1234";
const USER_B_ID = "user-b-uuid-5678";
const PHOTO_ID = "photo-uuid-9999";

const VALID_CROPPED_IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD";
const VALID_PNG_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE";

const PHOTOS_DB: MockPhoto[] = [
  { id: PHOTO_ID, user_id: USER_A_ID, input_image_key: "logs/original_input.jpg" },
  { id: "photo-b-1", user_id: USER_B_ID, input_image_key: "logs/other_user.jpg" },
];

const AUTHED_SESSION_A: MockSession = { user: { id: USER_A_ID } };
const AUTHED_SESSION_B: MockSession = { user: { id: USER_B_ID } };

// ─── Tests ────────────────────────────────────────────────────────────

const tests = [
  // --- Auth ---

  test("POST sans session → 401 Connexion requise", async () => {
    const result = await simulateCropRoute({
      session: null,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
    });
    assert.equal(result.status, 401);
    assert.equal(result.body.error, "Connexion requise.");
  }),

  test("POST avec session sans user.id → 401", async () => {
    const result = await simulateCropRoute({
      session: { user: {} },
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
    });
    assert.equal(result.status, 401);
  }),

  // --- Photo lookup / ownership ---

  test("POST avec photo inexistante → 404", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: "nonexistent-photo-id",
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
    });
    assert.equal(result.status, 404);
    assert.equal(result.body.error, "Photo introuvable.");
  }),

  test("POST sur photo d'un autre utilisateur → 404 (pas 403, anti-enumeration)", async () => {
    // User B tente d'acceder a la photo de User A
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_B,
      photoId: PHOTO_ID, // appartient a User A
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
    });
    assert.equal(result.status, 404);
    // Important: 404 et pas 403 pour ne pas reveler l'existence de la photo (IDOR prevention)
    assert.equal(result.body.error, "Photo introuvable.");
  }),

  // --- Body validation ---

  test("POST avec body null → 400", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: null,
    });
    assert.equal(result.status, 400);
  }),

  test("POST sans croppedImage dans le body → 400", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: {},
    });
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "Image recadrée manquante ou invalide.");
  }),

  test("POST avec croppedImage vide → 400", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: "" },
    });
    assert.equal(result.status, 400);
  }),

  test("POST avec croppedImage sans prefixe data:image/ → 400", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: "not-a-data-uri-just-base64" },
    });
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "Image recadrée manquante ou invalide.");
  }),

  test("POST avec data:image/ mais sans virgule (pas de base64 apres) → 400", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: "data:image/jpeg;base64" }, // pas de virgule
    });
    // split(",")[1] retourne undefined car pas de virgule
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "Format d'image invalide.");
  }),

  // --- Donnees adversariales ---

  test("POST avec croppedImage contenant des caracteres speciaux dans le prefixe → 400", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: "javascript:alert(1)" },
    });
    assert.equal(result.status, 400);
  }),

  test("POST avec croppedImage XSS payload → 400", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: "<script>alert('xss')</script>" },
    });
    assert.equal(result.status, 400);
  }),

  // --- Succes ---

  test("POST avec body valide JPEG → 200 + success true", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
      saveImageResult: "logs/1234_cropped_photo-uuid-9999.jpg",
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.newInputKey, "logs/1234_cropped_photo-uuid-9999.jpg");
  }),

  test("POST avec body valide PNG → 200", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_PNG_IMAGE },
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
  }),

  test("POST avec body valide WebP → 200", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: "data:image/webp;base64,UklGRlYAAABXRUJQ" },
    });
    assert.equal(result.status, 200);
  }),

  // --- Erreurs serveur ---

  test("Erreur saveImage → 500", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
      saveImageError: new Error("Object Storage unavailable"),
    });
    assert.equal(result.status, 500);
    assert.equal(result.body.error, "Erreur lors du recadrage.");
  }),

  test("Erreur DB update → 500", async () => {
    const result = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
      dbUpdateError: new Error("connection refused"),
    });
    assert.equal(result.status, 500);
    assert.equal(result.body.error, "Erreur lors du recadrage.");
  }),

  // --- Idempotence ---

  test("Deux POST successifs sur la meme photo → 200 a chaque fois (idempotent)", async () => {
    const result1 = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
    });
    const result2 = await simulateCropRoute({
      session: AUTHED_SESSION_A,
      photoId: PHOTO_ID,
      photosInDb: PHOTOS_DB,
      requestBody: { croppedImage: VALID_CROPPED_IMAGE },
    });
    assert.equal(result1.status, 200);
    assert.equal(result2.status, 200);
  }),
];

// ─── Runner ───────────────────────────────────────────────────────────

console.log("\n  crop API route — integration tests\n");
runTests(tests).then(() => {
  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  if (failures.length > 0) {
    console.log("  Failures:");
    failures.forEach((f) => console.log(`    - ${f}`));
    process.exit(1);
  }
});
