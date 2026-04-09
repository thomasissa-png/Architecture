/**
 * Tests recommandations architecte pour lib/marchand/architect-agent.ts
 *
 * Mock OpenAI (responses.create). Couvre :
 * - generateRecommendations retourne un ArchitectRecommendationSet valide
 * - generateRecommendations filtre par budget
 * - generateRecommendations retourne null sur erreur API (apres retry)
 * - generateRecommendations retourne null sur JSON invalide
 * - generateRecommendations retourne null sur Zod validation failure
 * - filterByBudget garde les recs sans cout
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

import { generateRecommendations } from "@/lib/marchand/architect-agent";
import type { ValidatedRoom, LotQualification } from "@/lib/marchand/schemas";

// ─── Setup ────────────────────────────────────────────────────────

beforeEach(() => {
  responsesCreateMock.mockReset();
  process.env.OPENAI_API_KEY = "sk-test-fake";
});

// ─── Fixtures ─────────────────────────────────────────────────────

function validRoom(overrides: Partial<ValidatedRoom> = {}): ValidatedRoom {
  return {
    temp_id: "r1",
    name_raw: "Salon",
    surface_m2: 25,
    dimensions: { length_m: 5, width_m: 5 },
    ceiling_height_m: 2.5,
    windows_count: 2,
    doors_count: 1,
    floor: 0,
    confidence: 0.85,
    shape: "rectangular",
    notes: null,
    id: "550e8400-e29b-41d4-a716-446655440000",
    room_type: "salon",
    lot_id: "660e8400-e29b-41d4-a716-446655440000",
    is_estimated: false,
    photo_path: null,
    ...overrides,
  };
}

function validLot(overrides: Partial<LotQualification> = {}): LotQualification {
  return {
    id: "660e8400-e29b-41d4-a716-446655440000",
    name: "T3 RDC gauche",
    target_buyer: "famille",
    style_id: "scandinave",
    budget_travaux: 15000,
    contraintes: null,
    notes_commerciales: null,
    rooms: [validRoom()],
    ...overrides,
  };
}

function validRecommendationsJson() {
  return {
    recommendations: [
      {
        id: "rec_1",
        title: "Ouvrir la cuisine sur le salon",
        description: "Supprimer la cloison pour creer un espace de vie ouvert. Cette modification augmente la sensation d'espace et la luminosite.",
        action_type: "cloison",
        estimated_cost_eur: 3500,
        impact_level: "haute",
        affected_rooms: ["r1", "r2"],
        rationale_buyer: "Les familles recherchent des espaces de vie ouverts pour la convivialite.",
      },
      {
        id: "rec_2",
        title: "Sol en chene clair",
        description: "Remplacer le sol existant par un parquet chene clair. Le chene clair est le standard scandinave qui unifie visuellement l'espace.",
        action_type: "sol",
        estimated_cost_eur: 5000,
        impact_level: "haute",
        affected_rooms: ["r1"],
        rationale_buyer: "Un parquet chene clair est un argument de vente fort pour les familles.",
      },
      {
        id: "rec_3",
        title: "Luminaire suspension nordique",
        description: "Installer un luminaire suspension type PH5 dans le salon. Cette piece iconique ancre immediatement le style scandinave.",
        action_type: "luminaire",
        estimated_cost_eur: 800,
        impact_level: "moyenne",
        affected_rooms: ["r1"],
        rationale_buyer: "Un luminaire design valorise l'ensemble de la piece.",
      },
    ],
    summary: "Strategie de valorisation axee sur l'ouverture des espaces et la finition scandinave.",
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

// ─── Tests ────────────────────────────────────────────────────────

describe("generateRecommendations", () => {
  it("retourne un ArchitectRecommendationSet valide (cas nominal)", async () => {
    mockOpenAIResponse(validRecommendationsJson());

    const result = await generateRecommendations([validRoom()], validLot());

    expect(result).not.toBeNull();
    expect(result!.recommendations).toHaveLength(3);
    expect(result!.recommendations[0].title).toBe("Ouvrir la cuisine sur le salon");
    expect(result!.recommendations[0].action_type).toBe("cloison");
    expect(result!.summary).toContain("scandinave");
  });

  it("filtre les recommandations par budget", async () => {
    mockOpenAIResponse(validRecommendationsJson());

    // Budget de 5000 : seuls rec_1 (3500) et rec_3 (800) passent (total 4300)
    // rec_2 (5000) ne passe pas car 5000 > remaining (1500)
    const lot = validLot({ budget_travaux: 5000 });
    const result = await generateRecommendations([validRoom()], lot);

    expect(result).not.toBeNull();
    // rec_1 (3500) fits, rec_2 (5000 > 1500 remaining) is filtered, rec_3 (800 < 1500) fits
    expect(result!.recommendations).toHaveLength(2);
    expect(result!.recommendations[0].id).toBe("rec_1");
    expect(result!.recommendations[1].id).toBe("rec_3");
  });

  it("garde les recommandations sans cout (estimated_cost_eur null)", async () => {
    const data = validRecommendationsJson();
    data.recommendations[1].estimated_cost_eur = null;
    mockOpenAIResponse(data);

    const lot = validLot({ budget_travaux: 4000 });
    const result = await generateRecommendations([validRoom()], lot);

    expect(result).not.toBeNull();
    // rec_1 (3500) fits, rec_2 (null cost, kept), rec_3 (800 > 500 remaining) filtered
    expect(result!.recommendations).toHaveLength(2);
    expect(result!.recommendations.find((r) => r.estimated_cost_eur === null)).toBeDefined();
  });

  it("ne filtre pas si budget_travaux est null", async () => {
    mockOpenAIResponse(validRecommendationsJson());

    const lot = validLot({ budget_travaux: null });
    const result = await generateRecommendations([validRoom()], lot);

    expect(result).not.toBeNull();
    expect(result!.recommendations).toHaveLength(3);
  });

  it("retry une fois sur erreur API puis reussit", async () => {
    mockOpenAIError("API timeout");
    mockOpenAIResponse(validRecommendationsJson());

    const result = await generateRecommendations([validRoom()], validLot());

    expect(result).not.toBeNull();
    expect(result!.recommendations).toHaveLength(3);
    expect(responsesCreateMock).toHaveBeenCalledTimes(2);
  });

  it("retourne null apres 2 echecs API (erreur non bloquante)", async () => {
    mockOpenAIError("API error 1");
    mockOpenAIError("API error 2");

    const result = await generateRecommendations([validRoom()], validLot());

    expect(result).toBeNull();
  });

  it("retourne null sur JSON invalide (non parsable)", async () => {
    responsesCreateMock.mockResolvedValueOnce({
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "Not JSON" }],
        },
      ],
    });

    const result = await generateRecommendations([validRoom()], validLot());
    expect(result).toBeNull();
  });

  it("retourne null si Zod validation echoue", async () => {
    // Valid JSON but fails Zod (recommendations empty)
    mockOpenAIResponse({
      recommendations: [],
      summary: "Test",
    });

    const result = await generateRecommendations([validRoom()], validLot());
    expect(result).toBeNull();
  });

  it("retourne null si pas de message dans la reponse", async () => {
    responsesCreateMock.mockResolvedValueOnce({
      output: [{ type: "tool_call" }],
    });
    // Retry also fails with same issue
    responsesCreateMock.mockResolvedValueOnce({
      output: [{ type: "tool_call" }],
    });

    const result = await generateRecommendations([validRoom()], validLot());
    expect(result).toBeNull();
  });

  it("inclut le style_id dans le system prompt", async () => {
    mockOpenAIResponse(validRecommendationsJson());

    await generateRecommendations([validRoom()], validLot({ style_id: "art_deco" }));

    const callArgs = responsesCreateMock.mock.calls[0][0];
    const systemMsg = callArgs.input.find((m: { role: string }) => m.role === "system");
    expect(systemMsg.content).toContain("art_deco");
  });

  it("inclut les infos du lot dans le user message", async () => {
    mockOpenAIResponse(validRecommendationsJson());

    await generateRecommendations(
      [validRoom()],
      validLot({
        name: "T4 Etage 2",
        target_buyer: "investisseur_locatif",
        budget_travaux: 8000,
        contraintes: "PMR obligatoire",
      })
    );

    const callArgs = responsesCreateMock.mock.calls[0][0];
    const userMsg = callArgs.input.find((m: { role: string }) => m.role === "user");
    expect(userMsg.content).toContain("T4 Etage 2");
    expect(userMsg.content).toContain("investisseur_locatif");
    expect(userMsg.content).toContain("8000");
    expect(userMsg.content).toContain("PMR obligatoire");
  });
});
