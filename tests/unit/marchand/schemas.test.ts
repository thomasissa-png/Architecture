/**
 * Tests Zod validation pour lib/marchand/schemas.ts
 *
 * Couvre :
 * - PlanExtractionResult : cas nominal, rooms vide, confidence hors bornes
 * - Tous les enums (TypeBien, RoomType, TargetBuyer, etc.)
 * - Champs nullable (surface_m2, dimensions, ceiling_height_m)
 * - ExtractedRoom : validation individuelle
 * - ArchitectRecommendationSet : limites min/max
 * - LotDefinition, LotQualification
 */
import { describe, it, expect } from "vitest";
import {
  TypeBienEnum,
  RoomTypeEnum,
  TargetBuyerEnum,
  ProjectStatusEnum,
  LotStatusEnum,
  GenerationStatusEnum,
  RoomShapeEnum,
  RoomSourceEnum,
  ActionTypeEnum,
  ImpactLevelEnum,
  ExtractionWarningEnum,
  ScaleReferenceEnum,
  GroupingStrategyEnum,
  ExtractedRoomSchema,
  PlanExtractionResultSchema,
  RecommendationSchema,
  ArchitectRecommendationSetSchema,
  LotDefinitionSchema,
  LotQualificationSchema,
  ValidatedRoomSchema,
} from "@/lib/marchand/schemas";

// ─── Fixtures ──────────────────────────────────────────────────────

function validExtractedRoom(overrides: Record<string, unknown> = {}) {
  return {
    temp_id: "r1",
    name_raw: "Salon",
    surface_m2: 25.5,
    dimensions: { length_m: 5.1, width_m: 5.0 },
    ceiling_height_m: 2.5,
    windows_count: 2,
    doors_count: 1,
    floor: 0,
    confidence: 0.85,
    shape: "rectangular" as const,
    notes: null,
    ...overrides,
  };
}

function validPlanExtractionResult(overrides: Record<string, unknown> = {}) {
  return {
    rooms: [validExtractedRoom()],
    total_surface_m2: 65.0,
    floors_count: 1,
    extraction_warnings: [] as string[],
    scale_reference: "dimensions_on_plan" as const,
    ...overrides,
  };
}

function validRecommendation(overrides: Record<string, unknown> = {}) {
  return {
    id: "rec_1",
    title: "Ouvrir la cuisine sur le salon",
    description: "Supprimer la cloison entre cuisine et salon pour creer un espace de vie ouvert de 35m2, plus lumineux et convivial.",
    action_type: "cloison" as const,
    estimated_cost_eur: 3500,
    impact_level: "haute" as const,
    affected_rooms: ["r1", "r2"],
    rationale_buyer: "Les familles recherchent des espaces de vie ouverts pour surveiller les enfants.",
    ...overrides,
  };
}

// ─── Enums ─────────────────────────────────────────────────────────

describe("Enums Zod", () => {
  it("TypeBienEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["immeuble", "appartement", "maison", "bureaux", "local_commercial"];
    for (const v of valeurs) {
      expect(TypeBienEnum.safeParse(v).success).toBe(true);
    }
  });

  it("TypeBienEnum rejette une valeur invalide", () => {
    expect(TypeBienEnum.safeParse("garage").success).toBe(false);
  });

  it("RoomTypeEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["salon", "cuisine", "chambre", "sdb", "wc", "bureau", "couloir", "cave", "autre"];
    for (const v of valeurs) {
      expect(RoomTypeEnum.safeParse(v).success).toBe(true);
    }
  });

  it("RoomTypeEnum rejette une valeur invalide", () => {
    expect(RoomTypeEnum.safeParse("grenier").success).toBe(false);
  });

  it("TargetBuyerEnum accepte toutes les valeurs valides", () => {
    const valeurs = [
      "famille", "couple_sans_enfant", "etudiant",
      "investisseur_locatif", "senior", "professionnel_liberal",
    ];
    for (const v of valeurs) {
      expect(TargetBuyerEnum.safeParse(v).success).toBe(true);
    }
  });

  it("TargetBuyerEnum rejette une valeur invalide", () => {
    expect(TargetBuyerEnum.safeParse("retraite").success).toBe(false);
  });

  it("ProjectStatusEnum accepte toutes les valeurs valides", () => {
    const valeurs = [
      "plan_uploaded", "extraction_done", "validated", "qualified",
      "plan_final", "generating", "visuals_done", "delivered", "extraction_failed",
    ];
    for (const v of valeurs) {
      expect(ProjectStatusEnum.safeParse(v).success).toBe(true);
    }
  });

  it("LotStatusEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["pending", "qualified", "plan_final", "generating", "visuals_done", "pdf_ready"];
    for (const v of valeurs) {
      expect(LotStatusEnum.safeParse(v).success).toBe(true);
    }
  });

  it("GenerationStatusEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["pending", "generating_pass1", "generating_pass2", "done", "failed"];
    for (const v of valeurs) {
      expect(GenerationStatusEnum.safeParse(v).success).toBe(true);
    }
  });

  it("RoomShapeEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["rectangular", "square", "L-shaped", "narrow_corridor", "irregular"];
    for (const v of valeurs) {
      expect(RoomShapeEnum.safeParse(v).success).toBe(true);
    }
  });

  it("RoomSourceEnum accepte toutes les valeurs valides", () => {
    expect(RoomSourceEnum.safeParse("ai_extraction").success).toBe(true);
    expect(RoomSourceEnum.safeParse("manual").success).toBe(true);
  });

  it("ActionTypeEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["redistribution", "cloison", "affectation", "deco", "sol", "luminaire"];
    for (const v of valeurs) {
      expect(ActionTypeEnum.safeParse(v).success).toBe(true);
    }
  });

  it("ImpactLevelEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["basse", "moyenne", "haute"];
    for (const v of valeurs) {
      expect(ImpactLevelEnum.safeParse(v).success).toBe(true);
    }
  });

  it("ExtractionWarningEnum accepte toutes les valeurs valides", () => {
    const valeurs = [
      "no_dimensions_found", "low_resolution", "partial_occlusion",
      "no_scale_reference", "technical_symbols_ignored",
    ];
    for (const v of valeurs) {
      expect(ExtractionWarningEnum.safeParse(v).success).toBe(true);
    }
  });

  it("ScaleReferenceEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["dimensions_on_plan", "door_standard_83cm", "scale_bar", "none"];
    for (const v of valeurs) {
      expect(ScaleReferenceEnum.safeParse(v).success).toBe(true);
    }
  });

  it("GroupingStrategyEnum accepte toutes les valeurs valides", () => {
    const valeurs = ["by_floor", "by_zone", "manual_suggestion"];
    for (const v of valeurs) {
      expect(GroupingStrategyEnum.safeParse(v).success).toBe(true);
    }
  });
});

// ─── ExtractedRoom ─────────────────────────────────────────────────

describe("ExtractedRoomSchema", () => {
  it("valide une room complete avec tous les champs", () => {
    const result = ExtractedRoomSchema.safeParse(validExtractedRoom());
    expect(result.success).toBe(true);
  });

  it("valide une room avec surface_m2 null", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ surface_m2: null })
    );
    expect(result.success).toBe(true);
  });

  it("valide une room avec dimensions null", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ dimensions: null })
    );
    expect(result.success).toBe(true);
  });

  it("valide une room avec ceiling_height_m null", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ ceiling_height_m: null })
    );
    expect(result.success).toBe(true);
  });

  it("valide une room avec floor null", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ floor: null })
    );
    expect(result.success).toBe(true);
  });

  it("valide une room avec shape null", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ shape: null })
    );
    expect(result.success).toBe(true);
  });

  it("valide une room avec notes null", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ notes: null })
    );
    expect(result.success).toBe(true);
  });

  it("rejette name_raw vide", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ name_raw: "" })
    );
    expect(result.success).toBe(false);
  });

  it("rejette surface_m2 negative", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ surface_m2: -5 })
    );
    expect(result.success).toBe(false);
  });

  it("rejette surface_m2 = 0", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ surface_m2: 0 })
    );
    expect(result.success).toBe(false);
  });

  it("rejette confidence > 1", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ confidence: 1.5 })
    );
    expect(result.success).toBe(false);
  });

  it("rejette confidence < 0", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ confidence: -0.1 })
    );
    expect(result.success).toBe(false);
  });

  it("accepte confidence = 0 (borne basse)", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ confidence: 0 })
    );
    expect(result.success).toBe(true);
  });

  it("accepte confidence = 1 (borne haute)", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ confidence: 1 })
    );
    expect(result.success).toBe(true);
  });

  it("rejette windows_count negatif", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ windows_count: -1 })
    );
    expect(result.success).toBe(false);
  });

  it("rejette doors_count negatif", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ doors_count: -1 })
    );
    expect(result.success).toBe(false);
  });

  it("rejette dimensions avec length_m negatif", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ dimensions: { length_m: -3, width_m: 4 } })
    );
    expect(result.success).toBe(false);
  });

  it("rejette une shape invalide", () => {
    const result = ExtractedRoomSchema.safeParse(
      validExtractedRoom({ shape: "circular" })
    );
    expect(result.success).toBe(false);
  });
});

// ─── PlanExtractionResult ──────────────────────────────────────────

describe("PlanExtractionResultSchema", () => {
  it("valide un resultat complet (cas nominal)", () => {
    const result = PlanExtractionResultSchema.safeParse(validPlanExtractionResult());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rooms).toHaveLength(1);
      expect(result.data.floors_count).toBe(1);
    }
  });

  it("valide un resultat avec plusieurs rooms", () => {
    const result = PlanExtractionResultSchema.safeParse(
      validPlanExtractionResult({
        rooms: [
          validExtractedRoom({ temp_id: "r1" }),
          validExtractedRoom({ temp_id: "r2", name_raw: "Cuisine", surface_m2: 12 }),
          validExtractedRoom({ temp_id: "r3", name_raw: "Chambre", surface_m2: 15 }),
        ],
        floors_count: 1,
        total_surface_m2: 52.5,
      })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rooms).toHaveLength(3);
    }
  });

  it("rejette un resultat avec rooms vide (min 1)", () => {
    const result = PlanExtractionResultSchema.safeParse(
      validPlanExtractionResult({ rooms: [] })
    );
    expect(result.success).toBe(false);
  });

  it("rejette un resultat avec floors_count = 0", () => {
    const result = PlanExtractionResultSchema.safeParse(
      validPlanExtractionResult({ floors_count: 0 })
    );
    expect(result.success).toBe(false);
  });

  it("valide un resultat avec total_surface_m2 null", () => {
    const result = PlanExtractionResultSchema.safeParse(
      validPlanExtractionResult({ total_surface_m2: null })
    );
    expect(result.success).toBe(true);
  });

  it("rejette total_surface_m2 negatif", () => {
    const result = PlanExtractionResultSchema.safeParse(
      validPlanExtractionResult({ total_surface_m2: -10 })
    );
    expect(result.success).toBe(false);
  });

  it("valide avec tous les extraction_warnings", () => {
    const result = PlanExtractionResultSchema.safeParse(
      validPlanExtractionResult({
        extraction_warnings: [
          "no_dimensions_found",
          "low_resolution",
          "partial_occlusion",
          "no_scale_reference",
          "technical_symbols_ignored",
        ],
      })
    );
    expect(result.success).toBe(true);
  });

  it("rejette un extraction_warning invalide", () => {
    const result = PlanExtractionResultSchema.safeParse(
      validPlanExtractionResult({
        extraction_warnings: ["invalid_warning"],
      })
    );
    expect(result.success).toBe(false);
  });

  it("valide chaque valeur de scale_reference", () => {
    for (const sr of ["dimensions_on_plan", "door_standard_83cm", "scale_bar", "none"]) {
      const result = PlanExtractionResultSchema.safeParse(
        validPlanExtractionResult({ scale_reference: sr })
      );
      expect(result.success).toBe(true);
    }
  });
});

// ─── ArchitectRecommendationSet ────────────────────────────────────

describe("ArchitectRecommendationSetSchema", () => {
  it("valide un set avec 1 recommandation (min)", () => {
    const result = ArchitectRecommendationSetSchema.safeParse({
      recommendations: [validRecommendation()],
      summary: "Strategie de valorisation axee sur l'ouverture des espaces.",
    });
    expect(result.success).toBe(true);
  });

  it("valide un set avec 8 recommandations (max)", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      validRecommendation({ id: `rec_${i + 1}` })
    );
    const result = ArchitectRecommendationSetSchema.safeParse({
      recommendations: recs,
      summary: "Valorisation complete du lot.",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un set avec 0 recommandations", () => {
    const result = ArchitectRecommendationSetSchema.safeParse({
      recommendations: [],
      summary: "Rien a recommander.",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un set avec 9 recommandations (> max 8)", () => {
    const recs = Array.from({ length: 9 }, (_, i) =>
      validRecommendation({ id: `rec_${i + 1}` })
    );
    const result = ArchitectRecommendationSetSchema.safeParse({
      recommendations: recs,
      summary: "Trop de recommandations.",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un summary > 300 caracteres", () => {
    const result = ArchitectRecommendationSetSchema.safeParse({
      recommendations: [validRecommendation()],
      summary: "A".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});

// ─── RecommendationSchema ──────────────────────────────────────────

describe("RecommendationSchema", () => {
  it("valide une recommandation complete", () => {
    const result = RecommendationSchema.safeParse(validRecommendation());
    expect(result.success).toBe(true);
  });

  it("valide estimated_cost_eur null", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ estimated_cost_eur: null })
    );
    expect(result.success).toBe(true);
  });

  it("rejette title trop court (< 5 chars)", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ title: "Ok" })
    );
    expect(result.success).toBe(false);
  });

  it("rejette title trop long (> 100 chars)", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ title: "A".repeat(101) })
    );
    expect(result.success).toBe(false);
  });

  it("rejette description trop courte (< 20 chars)", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ description: "Court" })
    );
    expect(result.success).toBe(false);
  });

  it("rejette description trop longue (> 500 chars)", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ description: "A".repeat(501) })
    );
    expect(result.success).toBe(false);
  });

  it("rejette affected_rooms vide", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ affected_rooms: [] })
    );
    expect(result.success).toBe(false);
  });

  it("rejette rationale_buyer > 200 chars", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ rationale_buyer: "A".repeat(201) })
    );
    expect(result.success).toBe(false);
  });

  it("rejette un action_type invalide", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ action_type: "demolition" })
    );
    expect(result.success).toBe(false);
  });

  it("rejette un impact_level invalide", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ impact_level: "critique" })
    );
    expect(result.success).toBe(false);
  });

  it("rejette estimated_cost_eur negatif", () => {
    const result = RecommendationSchema.safeParse(
      validRecommendation({ estimated_cost_eur: -100 })
    );
    expect(result.success).toBe(false);
  });
});

// ─── LotDefinitionSchema ──────────────────────────────────────────

describe("LotDefinitionSchema", () => {
  it("valide un lot complet", () => {
    const result = LotDefinitionSchema.safeParse({
      temp_id: "lot_1",
      name: "T3 RDC gauche",
      room_ids: ["r1", "r2", "r3"],
      surface_m2: 65.0,
      floor: 0,
    });
    expect(result.success).toBe(true);
  });

  it("valide un lot avec surface_m2 null", () => {
    const result = LotDefinitionSchema.safeParse({
      temp_id: "lot_1",
      name: "T2 etage",
      room_ids: ["r1"],
      surface_m2: null,
      floor: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejette un lot avec room_ids vide", () => {
    const result = LotDefinitionSchema.safeParse({
      temp_id: "lot_1",
      name: "Lot vide",
      room_ids: [],
      surface_m2: null,
      floor: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejette un lot avec name vide", () => {
    const result = LotDefinitionSchema.safeParse({
      temp_id: "lot_1",
      name: "",
      room_ids: ["r1"],
      surface_m2: null,
      floor: null,
    });
    expect(result.success).toBe(false);
  });
});

// ─── ValidatedRoomSchema ──────────────────────────────────────────

describe("ValidatedRoomSchema", () => {
  it("valide une room validee complete", () => {
    const result = ValidatedRoomSchema.safeParse({
      ...validExtractedRoom(),
      id: "550e8400-e29b-41d4-a716-446655440000",
      room_type: "salon",
      lot_id: "660e8400-e29b-41d4-a716-446655440000",
      is_estimated: false,
      photo_path: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejette un id non UUID", () => {
    const result = ValidatedRoomSchema.safeParse({
      ...validExtractedRoom(),
      id: "not-a-uuid",
      room_type: "salon",
      lot_id: null,
      is_estimated: false,
      photo_path: null,
    });
    expect(result.success).toBe(false);
  });

  it("valide lot_id null", () => {
    const result = ValidatedRoomSchema.safeParse({
      ...validExtractedRoom(),
      id: "550e8400-e29b-41d4-a716-446655440000",
      room_type: "chambre",
      lot_id: null,
      is_estimated: true,
      photo_path: "logs/abc.jpg",
    });
    expect(result.success).toBe(true);
  });
});

// ─── LotQualificationSchema ───────────────────────────────────────

describe("LotQualificationSchema", () => {
  it("valide une qualification complete", () => {
    const result = LotQualificationSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "T3 RDC",
      target_buyer: "famille",
      style_id: "scandinave",
      budget_travaux: 15000,
      contraintes: "Pas de mur porteur",
      notes_commerciales: "Proche ecoles",
      rooms: [
        {
          ...validExtractedRoom(),
          id: "660e8400-e29b-41d4-a716-446655440000",
          room_type: "salon",
          lot_id: "550e8400-e29b-41d4-a716-446655440000",
          is_estimated: false,
          photo_path: null,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("valide budget_travaux null", () => {
    const result = LotQualificationSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Studio",
      target_buyer: "etudiant",
      style_id: "contemporain",
      budget_travaux: null,
      contraintes: null,
      notes_commerciales: null,
      rooms: [
        {
          ...validExtractedRoom(),
          id: "660e8400-e29b-41d4-a716-446655440000",
          room_type: "chambre",
          lot_id: "550e8400-e29b-41d4-a716-446655440000",
          is_estimated: true,
          photo_path: null,
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
