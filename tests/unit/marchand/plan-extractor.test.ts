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

import { extractPlanData, extractMultiplePlans, PlanExtractionError } from "@/lib/marchand/plan-extractor";

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
