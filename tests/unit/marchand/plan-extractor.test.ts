/**
 * Tests extraction de plan pour lib/marchand/plan-extractor.ts
 *
 * Mock OpenAI (responses.create). Couvre :
 * - extractPlanData retourne un PlanExtractionResult valide
 * - extractPlanData retry une fois sur erreur API
 * - extractPlanData lance PlanExtractionError sur JSON invalide
 * - extractPlanData lance self-correction si Zod validation echoue
 * - extractPlanData lance PlanExtractionError si self-correction echoue aussi
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock OpenAI ──────────────────────────────────────────────────

const { responsesCreateMock } = vi.hoisted(() => ({
  responsesCreateMock: vi.fn(),
}));

vi.mock("openai", () => {
  class OpenAI {
    responses = { create: responsesCreateMock };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_opts?: unknown) {}
  }
  return { default: OpenAI };
});

// ─── Import after mock ────────────────────────────────────────────

import { extractPlanData, extractMultiplePlans, PlanExtractionError, sanitizeSurfaces, validateExtraction } from "@/lib/marchand/plan-extractor";

// ─── Setup ────────────────────────────────────────────────────────

beforeEach(() => {
  responsesCreateMock.mockReset();
  process.env.OPENAI_API_KEY = "sk-test-fake";
});

// ─── Helpers ──────────────────────────────────────────────────────

function validExtractionJson() {
  return {
    rooms: [
      {
        temp_id: "r1",
        name_raw: "Salon",
        surface_m2: 25.0,
        dimensions: { length_m: 5.0, width_m: 5.0 },
        ceiling_height_m: 2.5,
        windows_count: 2,
        doors_count: 1,
        floor: 0,
        confidence: 0.85,
        shape: "rectangular",
        notes: null,
      },
      {
        temp_id: "r2",
        name_raw: "Cuisine",
        surface_m2: 12.0,
        dimensions: { length_m: 4.0, width_m: 3.0 },
        ceiling_height_m: 2.5,
        windows_count: 1,
        doors_count: 1,
        floor: 0,
        confidence: 0.9,
        shape: "rectangular",
        notes: null,
      },
    ],
    building_outline: {
      x_percent: 10,
      y_percent: 5,
      width_percent: 80,
      height_percent: 90,
    },
    total_surface_m2: 37.0,
    floors_count: 1,
    extraction_warnings: [],
    scale_reference: "dimensions_on_plan",
  };
}

function mockOpenAIResponse(json: unknown) {
  responsesCreateMock.mockResolvedValueOnce({
    output: [
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text: JSON.stringify(json),
          },
        ],
      },
    ],
  });
}

function mockOpenAIError(message: string) {
  responsesCreateMock.mockRejectedValueOnce(new Error(message));
}

function mockOpenAINoMessage() {
  responsesCreateMock.mockResolvedValueOnce({
    output: [{ type: "tool_call" }],
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe("extractPlanData", () => {
  it("retourne un PlanExtractionResult valide (cas nominal)", async () => {
    const data = validExtractionJson();
    mockOpenAIResponse(data);

    const result = await extractPlanData(
      "base64encodedimage",
      "image/jpeg",
      "appartement"
    );

    expect(result.rooms).toHaveLength(2);
    expect(result.rooms[0].name_raw).toBe("Salon");
    expect(result.rooms[0].surface_m2).toBe(25.0);
    expect(result.rooms[0].confidence).toBe(0.85);
    expect(result.total_surface_m2).toBe(37.0);
    expect(result.floors_count).toBe(1);
    expect(result.scale_reference).toBe("dimensions_on_plan");
    expect(result.extraction_warnings).toEqual([]);
  });

  it("retourne un resultat avec champs null", async () => {
    const data = {
      rooms: [
        {
          temp_id: "r1",
          name_raw: "Piece inconnue",
          surface_m2: null,
          dimensions: null,
          ceiling_height_m: null,
          windows_count: 0,
          doors_count: 1,
          floor: null,
          confidence: 0.3,
          shape: null,
          notes: "Piece partiellement masquee",
        },
      ],
      building_outline: null,
      total_surface_m2: null,
      floors_count: 1,
      extraction_warnings: ["no_dimensions_found", "partial_occlusion"],
      scale_reference: "none",
    };
    mockOpenAIResponse(data);

    const result = await extractPlanData("b64", "image/png", "maison");

    expect(result.rooms[0].surface_m2).toBeNull();
    expect(result.rooms[0].dimensions).toBeNull();
    expect(result.total_surface_m2).toBeNull();
    expect(result.extraction_warnings).toContain("no_dimensions_found");
    expect(result.extraction_warnings).toContain("partial_occlusion");
  });

  it("retry une fois sur erreur API puis reussit", async () => {
    // First call fails
    mockOpenAIError("API rate limit exceeded");
    // Retry succeeds
    mockOpenAIResponse(validExtractionJson());

    vi.useFakeTimers();
    const resultPromise = extractPlanData("b64", "image/jpeg", "immeuble");
    // Advance past the 5s sleep
    await vi.advanceTimersByTimeAsync(6000);
    vi.useRealTimers();

    const result = await resultPromise;
    expect(result.rooms).toHaveLength(2);
    expect(responsesCreateMock).toHaveBeenCalledTimes(2);
  });

  it("lance PlanExtractionError API_ERROR apres 2 echecs API", async () => {
    mockOpenAIError("API error 1");
    mockOpenAIError("API error 2");

    vi.useFakeTimers();
    const resultPromise = extractPlanData("b64", "image/jpeg", "maison");
    // Attach catch handler BEFORE advancing timers to prevent unhandled rejection
    const caught = resultPromise.catch((err) => err);
    await vi.advanceTimersByTimeAsync(6000);
    vi.useRealTimers();

    const err = await caught;
    expect(err).toBeInstanceOf(PlanExtractionError);
    expect((err as PlanExtractionError).reason).toBe("API_ERROR");
  });

  it("lance PlanExtractionError PARSING_FAILED sur JSON invalide (non parsable)", async () => {
    // Model returns valid response structure but invalid JSON content
    // Use mockResolvedValue (not Once) so retries also get this response
    responsesCreateMock.mockResolvedValue({
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "This is not valid JSON at all {{{",
            },
          ],
        },
      ],
    });

    try {
      await extractPlanData("b64", "image/jpeg", "appartement");
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PlanExtractionError);
      expect((err as PlanExtractionError).reason).toBe("PARSING_FAILED");
      expect((err as PlanExtractionError).message).toBe("Model returned invalid JSON");
    }
  });

  it("tente self-correction si Zod validation echoue, puis reussit", async () => {
    // First response: valid JSON but fails Zod (rooms empty)
    mockOpenAIResponse({
      rooms: [], // min(1) fails
      building_outline: null,
      total_surface_m2: 10,
      floors_count: 1,
      extraction_warnings: [],
      scale_reference: "none",
    });

    // Self-correction call succeeds with valid data
    mockOpenAIResponse(validExtractionJson());

    const result = await extractPlanData("b64", "image/jpeg", "maison");

    expect(result.rooms).toHaveLength(2);
    // responses.create called twice: first attempt + self-correction
    expect(responsesCreateMock).toHaveBeenCalledTimes(2);
  });

  it("lance PlanExtractionError si self-correction echoue aussi", async () => {
    // First: valid JSON but Zod fails (rooms empty, min 1 required)
    mockOpenAIResponse({
      rooms: [],
      total_surface_m2: 10,
      floors_count: 1,
      extraction_warnings: [],
      scale_reference: "none",
    });

    // Self-correction also returns invalid (rooms still empty)
    mockOpenAIResponse({
      rooms: [],
      building_outline: null,
      total_surface_m2: 5,
      floors_count: 1,
      extraction_warnings: [],
      scale_reference: "none",
    });

    try {
      await extractPlanData("b64", "image/jpeg", "bureaux");
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PlanExtractionError);
      expect((err as PlanExtractionError).reason).toBe("PARSING_FAILED");
    }
  });

  it("lance PlanExtractionError API_ERROR si pas de message dans la reponse (2 tentatives)", async () => {
    // No message output → callVisionExtraction throws → triggers retry
    // Both attempts fail → PlanExtractionError API_ERROR
    mockOpenAINoMessage();
    mockOpenAINoMessage();

    vi.useFakeTimers();
    const promise = extractPlanData("b64", "image/jpeg", "appartement");
    // Attach catch handler BEFORE advancing timers to prevent unhandled rejection
    const caught = promise.catch((err) => err);
    await vi.advanceTimersByTimeAsync(6000);
    vi.useRealTimers();

    const err = await caught;
    expect(err).toBeInstanceOf(PlanExtractionError);
    expect((err as PlanExtractionError).reason).toBe("API_ERROR");
    expect((err as PlanExtractionError).message).toContain("No message output");
  });

  it("utilise le bon MIME type dans le data URL", async () => {
    mockOpenAIResponse(validExtractionJson());

    await extractPlanData("abc123base64", "image/png", "maison");

    const callArgs = responsesCreateMock.mock.calls[0][0];
    const imageContent = callArgs.input[1].content.find(
      (c: { type: string }) => c.type === "input_image"
    );
    expect(imageContent.image_url).toBe("data:image/png;base64,abc123base64");
  });

  it("utilise GPT-4o avec input_file pour les PDF", async () => {
    mockOpenAIResponse(validExtractionJson());

    await extractPlanData("JVBERi0xLjQK", "application/pdf", "immeuble");

    const callArgs = responsesCreateMock.mock.calls[0][0];
    // Should use gpt-4o for PDF
    expect(callArgs.model).toBe("gpt-4o");
    // Should use input_file type (not input_image)
    const fileContent = callArgs.input[1].content.find(
      (c: { type: string }) => c.type === "input_file"
    );
    expect(fileContent).toBeDefined();
    expect(fileContent.filename).toBe("plan.pdf");
    expect(fileContent.file_data).toBe("data:application/pdf;base64,JVBERi0xLjQK");
  });

  it("detecte PDF via magic bytes meme si MIME type est incorrect", async () => {
    mockOpenAIResponse(validExtractionJson());

    // MIME type says image/jpeg but base64 starts with PDF magic bytes
    await extractPlanData("JVBERi0xLjQKfake", "image/jpeg", "appartement");

    const callArgs = responsesCreateMock.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-4o");
  });
});

describe("extractMultiplePlans", () => {
  it("delegue a extractPlanData pour un seul plan", async () => {
    mockOpenAIResponse(validExtractionJson());

    const result = await extractMultiplePlans(
      [{ base64: "abc123", mimeType: "image/jpeg", floorIndex: 0 }],
      "appartement"
    );

    expect(result.rooms).toHaveLength(2);
    expect(result.floors_count).toBe(1);
  });

  it("fusionne les pieces de plusieurs plans avec floor auto-assigne", async () => {
    // Floor 0
    mockOpenAIResponse({
      rooms: [
        {
          temp_id: "r1",
          name_raw: "Salon",
          surface_m2: 25.0,
          dimensions: { length_m: 5.0, width_m: 5.0 },
          ceiling_height_m: 2.5,
          windows_count: 2,
          doors_count: 1,
          floor: 0,
          confidence: 0.85,
          shape: "rectangular",
          notes: null,
        },
      ],
      building_outline: { x_percent: 5, y_percent: 5, width_percent: 90, height_percent: 90 },
      total_surface_m2: 25.0,
      floors_count: 1,
      extraction_warnings: [],
      scale_reference: "dimensions_on_plan",
    });

    // Floor 1
    mockOpenAIResponse({
      rooms: [
        {
          temp_id: "r1",
          name_raw: "Chambre",
          surface_m2: 15.0,
          dimensions: { length_m: 5.0, width_m: 3.0 },
          ceiling_height_m: 2.5,
          windows_count: 1,
          doors_count: 1,
          floor: 0,
          confidence: 0.9,
          shape: "rectangular",
          notes: null,
        },
      ],
      building_outline: { x_percent: 5, y_percent: 5, width_percent: 90, height_percent: 90 },
      total_surface_m2: 15.0,
      floors_count: 1,
      extraction_warnings: ["no_scale_reference"],
      scale_reference: "door_standard_83cm",
    });

    const result = await extractMultiplePlans(
      [
        { base64: "floor0", mimeType: "image/jpeg", floorIndex: 0 },
        { base64: "floor1", mimeType: "image/png", floorIndex: 1 },
      ],
      "immeuble"
    );

    expect(result.rooms).toHaveLength(2);
    expect(result.rooms[0].floor).toBe(0);
    expect(result.rooms[0].temp_id).toBe("f0_r1");
    expect(result.rooms[1].floor).toBe(1);
    expect(result.rooms[1].temp_id).toBe("f1_r1");
    expect(result.total_surface_m2).toBe(40.0);
    expect(result.floors_count).toBe(2);
    expect(result.extraction_warnings).toContain("no_scale_reference");
    expect(result.scale_reference).toBe("dimensions_on_plan");
  });

  it("lance PlanExtractionError si aucun plan fourni", async () => {
    try {
      await extractMultiplePlans([], "maison");
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(PlanExtractionError);
      expect((err as PlanExtractionError).reason).toBe("PLAN_UNREADABLE");
    }
  });
});

describe("PlanExtractionError", () => {
  it("a le bon name et reason", () => {
    const err = new PlanExtractionError("API_ERROR", "Test message");
    expect(err.name).toBe("PlanExtractionError");
    expect(err.reason).toBe("API_ERROR");
    expect(err.message).toBe("Test message");
  });

  it("est une instance de Error", () => {
    const err = new PlanExtractionError("PARSING_FAILED", "Bad JSON");
    expect(err).toBeInstanceOf(Error);
  });
});

// ─── sanitizeSurfaces ──────────────────────────────────────────────

describe("sanitizeSurfaces", () => {
  const makeRoom = (name: string, surface: number | null, bbox?: { x_percent: number; y_percent: number; width_percent: number; height_percent: number }) => ({
    name_raw: name,
    surface_m2: surface,
    dimensions: null as null,
    ceiling_height_m: null as number | null,
    windows_count: 1,
    doors_count: 1,
    floor: 0,
    shape: "rectangle" as const,
    confidence: 0.8,
    bounding_box: bbox ?? null,
  });

  const makeResult = (rooms: ReturnType<typeof makeRoom>[], outline?: { x_percent: number; y_percent: number; width_percent: number; height_percent: number } | null) => ({
    rooms,
    building_outline: outline ?? { x_percent: 5, y_percent: 5, width_percent: 90, height_percent: 90 },
    total_surface_m2: rooms.reduce((s, r) => s + (r.surface_m2 ?? 0), 0),
    floors_count: 1,
    extraction_warnings: [] as string[],
    scale_reference: "dimensions_on_plan" as const,
  });

  it("corrige les surfaces 10x trop grandes par type de pièce (bug cuisine 256m²)", () => {
    // Real bug: GPT returned Séjour/cuisine=256.1, Chambre=131.4, SdB=68.2
    const rooms = [
      makeRoom("WC", 3.0),
      makeRoom("Entrée", 20.2),
      makeRoom("Couloir", 20.8),
      makeRoom("Salle de bain", 68.2),
      makeRoom("Chambre", 131.4),
      makeRoom("Séjour / cuisine", 256.1),
    ];
    const result = sanitizeSurfaces(makeResult(rooms), "maison");

    // WC, Entrée, Couloir should stay (within range)
    const wc = result.data.rooms.find(r => r.name_raw === "WC");
    expect(wc!.surface_m2).toBe(3.0);

    const entree = result.data.rooms.find(r => r.name_raw === "Entrée");
    expect(entree!.surface_m2).toBe(20.2);

    // SdB 68.2 → 6.82 (10x per-type correction, max sdb=20)
    const sdb = result.data.rooms.find(r => r.name_raw === "Salle de bain");
    expect(sdb!.surface_m2).toBe(6.82);

    // Chambre 131.4 → 13.14 (10x per-type correction, max chambre=35)
    const chambre = result.data.rooms.find(r => r.name_raw === "Chambre");
    expect(chambre!.surface_m2).toBe(13.14);

    // Séjour/cuisine 256.1 → 25.61 (10x per-type correction, max salon=80)
    const sejour = result.data.rooms.find(r => r.name_raw === "Séjour / cuisine");
    expect(sejour!.surface_m2).toBe(25.61);

    // Corrections should be logged
    expect(result.log.filter(l => l.reason === "10x_per_type").length).toBe(3);
  });

  it("ne touche pas les surfaces raisonnables", () => {
    const rooms = [
      makeRoom("WC", 2.5),
      makeRoom("Chambre", 12.0),
      makeRoom("Salon", 25.0),
      makeRoom("Cuisine", 8.0),
    ];
    const result = sanitizeSurfaces(makeResult(rooms), "appartement");
    expect(result.log.length).toBe(0);
    expect(result.data.rooms[0].surface_m2).toBe(2.5);
    expect(result.data.rooms[1].surface_m2).toBe(12.0);
    expect(result.data.rooms[2].surface_m2).toBe(25.0);
    expect(result.data.rooms[3].surface_m2).toBe(8.0);
  });

  it("null les surfaces qui restent aberrantes même après /10", () => {
    const rooms = [
      makeRoom("WC", 500), // 500/10=50 → still too big for WC (max 8)
    ];
    const result = sanitizeSurfaces(makeResult(rooms), "appartement");
    expect(result.data.rooms[0].surface_m2).toBeNull();
  });

  it("clampe les bounding boxes hors limites", () => {
    const rooms = [
      makeRoom("Salon", 25, { x_percent: 50, y_percent: 30, width_percent: 70, height_percent: 40 }),
    ];
    const result = sanitizeSurfaces(makeResult(rooms), "appartement");
    const bb = result.data.rooms[0].bounding_box!;
    // x=50 + width=70 = 120 > 100 → clamped to width=50
    expect(bb.x_percent + bb.width_percent).toBeLessThanOrEqual(100);
  });

  it("clampe les bounding boxes trop larges (>60% du contour bâtiment)", () => {
    // With building outline at 90% width, maxW = 90 * 0.6 = 54
    const rooms = [
      makeRoom("Salon", 25, { x_percent: 5, y_percent: 5, width_percent: 80, height_percent: 30 }),
    ];
    const result = sanitizeSurfaces(makeResult(rooms), "appartement");
    expect(result.data.rooms[0].bounding_box!.width_percent).toBe(54);
    expect(result.log.some(l => l.reason === "bbox_width_clamped")).toBe(true);
  });

  it("détection 10x globale quand la médiane dépasse le max global", () => {
    const rooms = [
      makeRoom("Chambre 1", 150),
      makeRoom("Chambre 2", 120),
      makeRoom("Salon", 250),
    ];
    // For appartement, globalMaxRoom=80, median=150 > 80 → all /10
    const result = sanitizeSurfaces(makeResult(rooms), "appartement");
    expect(result.data.rooms[0].surface_m2).toBe(15.0);
    expect(result.data.rooms[1].surface_m2).toBe(12.0);
    expect(result.data.rooms[2].surface_m2).toBe(25.0);
    expect(result.log.filter(l => l.reason === "10x_correction").length).toBe(3);
  });
});

describe("validateExtraction — quality gates", () => {
  const makeRoom = (name: string, surface: number | null) => ({
    name_raw: name,
    surface_m2: surface,
    dimensions: null as null,
    ceiling_height_m: null as number | null,
    windows_count: 1,
    doors_count: 1,
    floor: 0,
    shape: "rectangle" as const,
    confidence: 0.8,
    bounding_box: null,
  });

  it("G1 échoue sur surfaces hors plage par type", () => {
    const data = {
      rooms: [makeRoom("Chambre", 50), makeRoom("WC", 2)],
      building_outline: { x_percent: 5, y_percent: 5, width_percent: 90, height_percent: 90 },
      total_surface_m2: 52,
      floors_count: 1,
      extraction_warnings: [] as string[],
      scale_reference: "dimensions_on_plan" as const,
    };
    const report = validateExtraction(data, [], "appartement");
    const g1 = report.gates.find(g => g.id === "G1_SURFACE_RANGE");
    expect(g1!.passed).toBe(false);
    expect(g1!.detail).toContain("Chambre");
  });

  it("G1 passe sur surfaces raisonnables", () => {
    const data = {
      rooms: [makeRoom("Chambre", 15), makeRoom("WC", 2)],
      building_outline: { x_percent: 5, y_percent: 5, width_percent: 90, height_percent: 90 },
      total_surface_m2: 17,
      floors_count: 1,
      extraction_warnings: [] as string[],
      scale_reference: "dimensions_on_plan" as const,
    };
    const report = validateExtraction(data, [], "appartement");
    const g1 = report.gates.find(g => g.id === "G1_SURFACE_RANGE");
    expect(g1!.passed).toBe(true);
  });

  it("G3B détecte l'absence de contour bâtiment", () => {
    const data = {
      rooms: [makeRoom("Chambre", 15), makeRoom("WC", 2)],
      building_outline: null,
      total_surface_m2: 17,
      floors_count: 1,
      extraction_warnings: [] as string[],
      scale_reference: "dimensions_on_plan" as const,
    };
    const report = validateExtraction(data, [], "appartement");
    const g3b = report.gates.find(g => g.id === "G3B_OUTLINE_EXISTS");
    expect(g3b).toBeDefined();
    expect(g3b!.passed).toBe(false);
  });

  it("G3B passe quand contour bâtiment présent", () => {
    const data = {
      rooms: [makeRoom("Chambre", 15), makeRoom("WC", 2)],
      building_outline: { x_percent: 10, y_percent: 10, width_percent: 80, height_percent: 80 },
      total_surface_m2: 17,
      floors_count: 1,
      extraction_warnings: [] as string[],
      scale_reference: "dimensions_on_plan" as const,
    };
    const report = validateExtraction(data, [], "appartement");
    const g3b = report.gates.find(g => g.id === "G3B_OUTLINE_EXISTS");
    expect(g3b).toBeDefined();
    expect(g3b!.passed).toBe(true);
  });
});

describe("building outline — sanitization + gates", () => {
  const makeRoom = (name: string, surface: number | null, bbox?: { x_percent: number; y_percent: number; width_percent: number; height_percent: number }) => ({
    name_raw: name,
    surface_m2: surface,
    dimensions: null as null,
    ceiling_height_m: null as number | null,
    windows_count: 1,
    doors_count: 1,
    floor: 0,
    shape: "rectangle" as const,
    confidence: 0.8,
    bounding_box: bbox ?? null,
  });

  it("clampe les bbox au contour du bâtiment (pas aux bords de l'image)", () => {
    // Building outline: x=20..80 (20+60=80), y=10..90 (10+80=90)
    // Room bbox extends beyond: x=75, width=20 → should be clamped to x=75, width=5
    const rooms = [
      makeRoom("Salon", 25, { x_percent: 75, y_percent: 15, width_percent: 20, height_percent: 15 }),
    ];
    const data = {
      rooms,
      building_outline: { x_percent: 20, y_percent: 10, width_percent: 60, height_percent: 80 },
      total_surface_m2: 25,
      floors_count: 1,
      extraction_warnings: [] as string[],
      scale_reference: "dimensions_on_plan" as const,
    };
    const result = sanitizeSurfaces(data, "appartement");
    const bb = result.data.rooms[0].bounding_box!;
    // x=75, building max x = 20+60=80, so width should be clamped to 80-75=5
    expect(bb.x_percent + bb.width_percent).toBeLessThanOrEqual(80);
  });

  it("clampe les bbox qui démarrent avant le contour", () => {
    // Building outline starts at x=15, but room starts at x=5
    const rooms = [
      makeRoom("Chambre", 15, { x_percent: 5, y_percent: 8, width_percent: 20, height_percent: 15 }),
    ];
    const data = {
      rooms,
      building_outline: { x_percent: 15, y_percent: 10, width_percent: 70, height_percent: 80 },
      total_surface_m2: 15,
      floors_count: 1,
      extraction_warnings: [] as string[],
      scale_reference: "dimensions_on_plan" as const,
    };
    const result = sanitizeSurfaces(data, "appartement");
    const bb = result.data.rooms[0].bounding_box!;
    // x should be clamped to building min x=15
    expect(bb.x_percent).toBeGreaterThanOrEqual(15);
    // y should be clamped to building min y=10
    expect(bb.y_percent).toBeGreaterThanOrEqual(10);
  });

  it("G3 échoue sur pièces hors contour bâtiment", () => {
    const makeGateRoom = (name: string, surface: number | null, bbox?: { x_percent: number; y_percent: number; width_percent: number; height_percent: number } | null) => ({
      name_raw: name,
      surface_m2: surface,
      dimensions: null as null,
      ceiling_height_m: null as number | null,
      windows_count: 1,
      doors_count: 1,
      floor: 0,
      shape: "rectangle" as const,
      confidence: 0.8,
      temp_id: `r_${name}`,
      notes: null as string | null,
      bounding_box: bbox ?? undefined,
    });
    // Building outline: x=20..80, y=10..90
    // Room bbox goes to x=85 (outside building at 80)
    const data = {
      rooms: [makeGateRoom("Salon", 25, { x_percent: 70, y_percent: 15, width_percent: 15, height_percent: 15 })],
      building_outline: { x_percent: 20, y_percent: 10, width_percent: 60, height_percent: 80 },
      total_surface_m2: 25,
      floors_count: 1,
      extraction_warnings: [] as ("no_dimensions_found" | "low_resolution" | "partial_occlusion" | "no_scale_reference" | "technical_symbols_ignored")[],
      scale_reference: "dimensions_on_plan" as const,
    };
    const report = validateExtraction(data, [], "appartement");
    const g3 = report.gates.find(g => g.id === "G3_BBOX_IN_BOUNDS");
    expect(g3!.passed).toBe(false);
    expect(g3!.detail).toContain("Salon");
    // Should trigger retry
    expect(report.shouldRetry).toBe(true);
  });

  it("sans contour, G3 utilise les bords de l'image (0-100%)", () => {
    const makeGateRoom = (name: string, surface: number | null, bbox?: { x_percent: number; y_percent: number; width_percent: number; height_percent: number } | null) => ({
      name_raw: name,
      surface_m2: surface,
      dimensions: null as null,
      ceiling_height_m: null as number | null,
      windows_count: 1,
      doors_count: 1,
      floor: 0,
      shape: "rectangle" as const,
      confidence: 0.8,
      temp_id: `r_${name}`,
      notes: null as string | null,
      bounding_box: bbox ?? undefined,
    });
    // No building outline — falls back to image bounds
    const data = {
      rooms: [makeGateRoom("Salon", 25, { x_percent: 10, y_percent: 10, width_percent: 30, height_percent: 30 })],
      building_outline: null,
      total_surface_m2: 25,
      floors_count: 1,
      extraction_warnings: [] as ("no_dimensions_found" | "low_resolution" | "partial_occlusion" | "no_scale_reference" | "technical_symbols_ignored")[],
      scale_reference: "dimensions_on_plan" as const,
    };
    const report = validateExtraction(data, [], "appartement");
    const g3 = report.gates.find(g => g.id === "G3_BBOX_IN_BOUNDS");
    // Room is within image bounds → should pass
    expect(g3!.passed).toBe(true);
  });
});
