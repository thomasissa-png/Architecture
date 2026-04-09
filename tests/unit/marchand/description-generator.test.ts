/**
 * Tests generation de description commerciale pour lib/marchand/description-generator.ts
 *
 * Mock OpenAI (responses.create). Couvre :
 * - generateCommercialDescription retourne un texte
 * - generateCommercialDescription retourne fallback sur erreur API
 * - generateCommercialDescription retourne fallback si reponse vide
 * - buildFallbackDescription contient l'adresse et le type
 * - buildFallbackDescription gere surface null
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

import { generateCommercialDescription } from "@/lib/marchand/description-generator";
import type { LotWithRooms, ProjectInfo } from "@/lib/marchand/schemas";

// ─── Setup ────────────────────────────────────────────────────────

beforeEach(() => {
  responsesCreateMock.mockReset();
  process.env.OPENAI_API_KEY = "sk-test-fake";
});

// ─── Fixtures ─────────────────────────────────────────────────────

function validLot(overrides: Partial<LotWithRooms> = {}): LotWithRooms {
  return {
    id: "lot-1",
    name: "T3 RDC gauche",
    surface_m2: 65,
    floor: 0,
    target_buyer: "famille",
    style_id: "scandinave",
    rooms: [
      { name: "Salon", room_type: "salon", surface_m2: 25 },
      { name: "Cuisine", room_type: "cuisine", surface_m2: 12 },
      { name: "Chambre 1", room_type: "chambre", surface_m2: 14 },
      { name: "Chambre 2", room_type: "chambre", surface_m2: 10 },
      { name: "Salle de bain", room_type: "sdb", surface_m2: 4 },
    ],
    ...overrides,
  };
}

function validProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    adresse: "10 rue de la Paix, 33000 Bordeaux",
    type_bien: "immeuble",
    surface_totale: 180,
    ...overrides,
  };
}

function mockOpenAIResponse(text: string) {
  responsesCreateMock.mockResolvedValueOnce({
    output: [
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text,
          },
        ],
      },
    ],
  });
}

// ─── Tests ────────────────────────────────────────────────────────

describe("generateCommercialDescription", () => {
  it("retourne le texte genere par le modele (cas nominal)", async () => {
    const description =
      "Bel appartement T3 de 65 m2 au rez-de-chaussee, " +
      "idealement situe au 10 rue de la Paix a Bordeaux. " +
      "Comprenant un salon lumineux de 25 m2, une cuisine " +
      "fonctionnelle et deux chambres spacieuses. " +
      "Decoration scandinave soignee. A decouvrir.";

    mockOpenAIResponse(description);

    const result = await generateCommercialDescription(validLot(), validProject());

    expect(result).toBe(description);
    expect(result).toContain("Bordeaux");
    expect(result).toContain("65 m2");
  });

  it("retourne fallback sur erreur API", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("API quota exceeded"));

    const result = await generateCommercialDescription(validLot(), validProject());

    // Fallback should contain address and type
    expect(result).toContain("10 rue de la Paix, 33000 Bordeaux");
    expect(result).toContain("5 pièces");
  });

  it("retourne fallback si pas de message dans la reponse", async () => {
    responsesCreateMock.mockResolvedValueOnce({
      output: [{ type: "tool_call" }],
    });

    const result = await generateCommercialDescription(validLot(), validProject());

    // Should be fallback
    expect(result).toContain("Bordeaux");
  });

  it("retourne fallback si texte de la reponse est vide", async () => {
    responsesCreateMock.mockResolvedValueOnce({
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "   " }],
        },
      ],
    });

    const result = await generateCommercialDescription(validLot(), validProject());

    expect(result).toContain("Bordeaux");
  });

  it("retourne fallback si pas de output_text dans content", async () => {
    responsesCreateMock.mockResolvedValueOnce({
      output: [
        {
          type: "message",
          content: [{ type: "image", url: "http://..." }],
        },
      ],
    });

    const result = await generateCommercialDescription(validLot(), validProject());

    expect(result).toContain("Bordeaux");
  });

  it("trim le texte retourne", async () => {
    mockOpenAIResponse("  Un bel appartement.  \n ");

    const result = await generateCommercialDescription(validLot(), validProject());

    expect(result).toBe("Un bel appartement.");
    expect(result).not.toMatch(/^\s/);
    expect(result).not.toMatch(/\s$/);
  });

  it("utilise gpt-4.1-mini comme modele", async () => {
    mockOpenAIResponse("Description test.");

    await generateCommercialDescription(validLot(), validProject());

    const callArgs = responsesCreateMock.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-4.1-mini");
  });

  it("inclut les infos du lot et du projet dans le user message", async () => {
    mockOpenAIResponse("Description test.");

    await generateCommercialDescription(
      validLot({ target_buyer: "investisseur_locatif", style_id: "art_deco" }),
      validProject({ type_bien: "appartement", adresse: "5 cours Pasteur, Bordeaux" })
    );

    const callArgs = responsesCreateMock.mock.calls[0][0];
    const userMsg = callArgs.input.find((m: { role: string }) => m.role === "user");
    expect(userMsg.content).toContain("investisseur_locatif");
    expect(userMsg.content).toContain("art_deco");
    expect(userMsg.content).toContain("5 cours Pasteur, Bordeaux");
    expect(userMsg.content).toContain("appartement");
  });
});

// ─── buildFallbackDescription (teste indirectement via le fallback) ──

describe("buildFallbackDescription (via fallback)", () => {
  // We trigger fallback by making the API fail

  it("contient l'adresse du projet", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const result = await generateCommercialDescription(
      validLot(),
      validProject({ adresse: "42 avenue Foch, Paris" })
    );

    expect(result).toContain("42 avenue Foch, Paris");
  });

  it("contient le type de bien en label lisible", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const result = await generateCommercialDescription(
      validLot(),
      validProject({ type_bien: "appartement" })
    );

    expect(result).toContain("appartement");
  });

  it("contient le nombre de pieces", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const lot = validLot({
      rooms: [
        { name: "Salon", room_type: "salon", surface_m2: 20 },
        { name: "Chambre", room_type: "chambre", surface_m2: 12 },
      ],
    });

    const result = await generateCommercialDescription(lot, validProject());

    expect(result).toContain("2 pièces");
  });

  it("affiche '1 piece' au singulier", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const lot = validLot({
      rooms: [{ name: "Studio", room_type: "autre", surface_m2: 20 }],
    });

    const result = await generateCommercialDescription(lot, validProject());

    expect(result).toContain("1 pièce");
  });

  it("contient la surface du lot si disponible", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const result = await generateCommercialDescription(
      validLot({ surface_m2: 85 }),
      validProject({ surface_totale: 200 })
    );

    expect(result).toContain("85 m");
  });

  it("utilise la surface totale du projet si surface lot null", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const result = await generateCommercialDescription(
      validLot({ surface_m2: null }),
      validProject({ surface_totale: 150 })
    );

    expect(result).toContain("150 m");
  });

  it("omet la surface si les deux sont null", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const result = await generateCommercialDescription(
      validLot({ surface_m2: null }),
      validProject({ surface_totale: null })
    );

    // Should not contain "m2" since no surface available
    expect(result).not.toContain("m2");
    // But should still contain address and type
    expect(result).toContain("Bordeaux");
  });

  it("label 'local de bureaux' pour type 'bureaux'", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const result = await generateCommercialDescription(
      validLot(),
      validProject({ type_bien: "bureaux" })
    );

    expect(result).toContain("local de bureaux");
  });

  it("label 'local commercial' pour type 'local_commercial'", async () => {
    responsesCreateMock.mockRejectedValueOnce(new Error("fail"));

    const result = await generateCommercialDescription(
      validLot(),
      validProject({ type_bien: "local_commercial" })
    );

    expect(result).toContain("local commercial");
  });
});
