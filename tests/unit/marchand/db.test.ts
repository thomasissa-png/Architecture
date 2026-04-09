/**
 * Tests CRUD pour lib/marchand/db.ts
 *
 * Mock pg Pool complet. Chaque fonction CRUD est testee :
 * - createProject, getProject, getProjectsByUser, updateProjectStatus
 * - createLot, getLotsByProject, getLot, updateLot
 * - createRoomsFromExtraction, getRoomsByProject, getRoomsByLot, updateRoom
 * - createRecommendations, getActiveRecommendations, updateRecommendationAcceptance
 * - createShareLink, getShareLinkByToken, getActiveShareLink
 * - verifyProjectOwnership
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// ─── Mock pg Pool ──────────────────────────────────────────────────

const queryMock = vi.fn();

vi.mock("@/lib/db", () => ({
  getPool: () => ({
    query: queryMock,
  }),
  ensureTable: vi.fn().mockResolvedValue(undefined),
}));

// ─── Import after mock ────────────────────────────────────────────

// We need to manage the module-level `proTablesEnsured` flag. Since it is set
// after the first successful ensureProTables(), and it persists across tests
// in the same file, the CREATE TABLE queries only fire once (first test).
// However, vi.restoreAllMocks in afterEach does NOT reset module state.
// The safest approach: let ensureProTables fire in the first test (it calls
// getPool().query for CREATE EXTENSION + CREATE TABLE), then all subsequent
// tests skip it because proTablesEnsured is already true.

import {
  createProject,
  getProject,
  getProjectsByUser,
  updateProjectStatus,
  createLot,
  getLotsByProject,
  getLot,
  updateLot,
  createRoomsFromExtraction,
  getRoomsByProject,
  getRoomsByLot,
  getRoom,
  updateRoom,
  createRecommendations,
  getActiveRecommendations,
  updateRecommendationAcceptance,
  createShareLink,
  getShareLinkByToken,
  getActiveShareLink,
  verifyProjectOwnership,
} from "@/lib/marchand/db";

// ─── Setup ─────────────────────────────────────────────────────────

/**
 * ensureProTables() has a module-level `proTablesEnsured` guard.
 * The first CRUD call triggers CREATE EXTENSION + CREATE TABLE (2 query calls).
 * After that, proTablesEnsured=true and subsequent calls skip it.
 *
 * We use beforeAll to trigger this initialization once, then reset the mock
 * so individual tests only deal with their own CRUD queries.
 */
beforeAll(async () => {
  queryMock.mockResolvedValue({ rows: [] });
  // Trigger ensureProTables by calling any CRUD function
  await getProject("init-trigger").catch(() => {});
});

beforeEach(() => {
  queryMock.mockReset();
  // Default: all queries succeed with empty rows
  queryMock.mockResolvedValue({ rows: [] });
});

// ─── Project CRUD ──────────────────────────────────────────────────

describe("createProject", () => {
  it("retourne un ProProject avec UUID", async () => {
    const fakeProject = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      user_id: "user_123",
      adresse: "10 rue de la Paix, Paris",
      type_bien: "appartement",
      surface_totale: 85.0,
      plan_file_path: "logs/plan.jpg",
      plan_mime_type: "image/jpeg",
      status: "plan_uploaded",
      extraction_data: null,
      stripe_payment_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // The INSERT RETURNING query
    queryMock.mockResolvedValueOnce({ rows: [fakeProject] });

    const result = await createProject({
      userId: "user_123",
      adresse: "10 rue de la Paix, Paris",
      typeBien: "appartement",
      surfaceTotale: 85.0,
      planFilePath: "logs/plan.jpg",
      planMimeType: "image/jpeg",
    });

    expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.user_id).toBe("user_123");
    expect(result.adresse).toBe("10 rue de la Paix, Paris");
    expect(result.type_bien).toBe("appartement");
    expect(result.status).toBe("plan_uploaded");
  });

  it("passe surfaceTotale null si non fournie", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "abc-uuid",
        user_id: "u1",
        adresse: "1 rue Test",
        type_bien: "maison",
        surface_totale: null,
        plan_file_path: null,
        plan_mime_type: null,
        status: "plan_uploaded",
        extraction_data: null,
        stripe_payment_id: null,
        created_at: new Date(),
        updated_at: new Date(),
      }],
    });

    await createProject({
      userId: "u1",
      adresse: "1 rue Test",
      typeBien: "maison",
    });

    // Find the INSERT query call (skip ensureProTables calls)
    const insertCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("INSERT INTO pro_projects")
    );
    expect(insertCall).toBeDefined();
    // surfaceTotale should be null (4th param)
    expect(insertCall![1][3]).toBeNull();
  });
});

describe("getProject", () => {
  it("retourne le projet si trouve", async () => {
    const fakeProject = {
      id: "proj-1",
      user_id: "u1",
      adresse: "5 rue de la Gare",
      type_bien: "immeuble",
      status: "extraction_done",
    };
    queryMock.mockResolvedValueOnce({ rows: [fakeProject] });

    const result = await getProject("proj-1");
    expect(result).toBeDefined();
    expect(result!.id).toBe("proj-1");
  });

  it("retourne null si projet introuvable", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const result = await getProject("nonexistent");
    expect(result).toBeNull();
  });
});

describe("getProjectsByUser", () => {
  it("retourne les projets de l'utilisateur", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: "p1", user_id: "u1", status: "plan_uploaded" },
        { id: "p2", user_id: "u1", status: "validated" },
      ],
    });

    const result = await getProjectsByUser("u1");
    expect(result).toHaveLength(2);
  });

  it("retourne tableau vide si aucun projet", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const result = await getProjectsByUser("u_new");
    expect(result).toEqual([]);
  });
});

describe("updateProjectStatus", () => {
  it("met a jour le status sans extractionData", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    await updateProjectStatus("proj-1", "validated");

    const updateCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("UPDATE pro_projects SET status")
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1]).toContain("validated");
  });

  it("met a jour le status avec extractionData", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const extractionData = {
      rooms: [{
        temp_id: "r1", name_raw: "Salon", surface_m2: 25,
        dimensions: null, ceiling_height_m: null,
        windows_count: 1, doors_count: 1, floor: 0,
        confidence: 0.8, shape: null, notes: null,
      }],
      total_surface_m2: 25,
      floors_count: 1,
      extraction_warnings: [],
      scale_reference: "none" as const,
    };

    await updateProjectStatus("proj-1", "extraction_done", extractionData);

    const updateCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("extraction_data")
    );
    expect(updateCall).toBeDefined();
  });
});

// ─── Lot CRUD ──────────────────────────────────────────────────────

describe("createLot", () => {
  it("cree un lot et retourne le resultat", async () => {
    const fakeLot = {
      id: "lot-uuid",
      project_id: "proj-1",
      name: "T3 RDC",
      floor: 0,
      target_buyer: null,
      style_id: null,
      status: "pending",
    };
    queryMock.mockResolvedValueOnce({ rows: [fakeLot] });

    const result = await createLot({
      projectId: "proj-1",
      name: "T3 RDC",
      floor: 0,
    });

    expect(result.id).toBe("lot-uuid");
    expect(result.name).toBe("T3 RDC");
  });
});

describe("getLotsByProject", () => {
  it("filtre les lots par project_id", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: "lot-1", project_id: "proj-1", name: "T2", floor: 0 },
        { id: "lot-2", project_id: "proj-1", name: "T3", floor: 1 },
      ],
    });

    const result = await getLotsByProject("proj-1");
    expect(result).toHaveLength(2);

    // Verify the SQL contains the project_id parameter
    const selectCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("SELECT * FROM pro_lots WHERE project_id")
    );
    expect(selectCall).toBeDefined();
    expect(selectCall![1]).toContain("proj-1");
  });
});

describe("getLot", () => {
  it("retourne un lot par id", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "lot-1", name: "T2", status: "pending" }],
    });

    const result = await getLot("lot-1");
    expect(result).toBeDefined();
    expect(result!.id).toBe("lot-1");
  });

  it("retourne null si lot introuvable", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const result = await getLot("nonexistent");
    expect(result).toBeNull();
  });
});

describe("updateLot", () => {
  it("met a jour les champs partiels", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    await updateLot("lot-1", { target_buyer: "famille", style_id: "scandinave" });

    const updateCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("UPDATE pro_lots SET")
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![0]).toContain("target_buyer");
    expect(updateCall![0]).toContain("style_id");
  });

  it("ne fait rien si aucun champ fourni", async () => {
    await updateLot("lot-1", {});

    // No UPDATE query should have been called
    const updateCalls = queryMock.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("UPDATE pro_lots")
    );
    expect(updateCalls).toHaveLength(0);
  });
});

// ─── Room CRUD ─────────────────────────────────────────────────────

describe("createRoomsFromExtraction", () => {
  it("insere N rooms et les retourne", async () => {
    const room1 = {
      id: "room-1", project_id: "proj-1", lot_id: "lot-1",
      name: "Salon", room_type: "autre", surface_m2: 25,
    };
    const room2 = {
      id: "room-2", project_id: "proj-1", lot_id: "lot-1",
      name: "Cuisine", room_type: "autre", surface_m2: 12,
    };

    // Each INSERT returns one row
    queryMock
      .mockResolvedValueOnce({ rows: [room1] })
      .mockResolvedValueOnce({ rows: [room2] });

    const extractedRooms = [
      {
        temp_id: "r1", name_raw: "Salon", surface_m2: 25 as number | null,
        dimensions: { length_m: 5, width_m: 5 } as { length_m: number; width_m: number } | null,
        ceiling_height_m: 2.5 as number | null,
        windows_count: 2, doors_count: 1, floor: 0 as number | null,
        confidence: 0.9, shape: "rectangular" as const,
        notes: null as string | null,
      },
      {
        temp_id: "r2", name_raw: "Cuisine", surface_m2: 12 as number | null,
        dimensions: null as { length_m: number; width_m: number } | null,
        ceiling_height_m: null as number | null,
        windows_count: 1, doors_count: 1, floor: 0 as number | null,
        confidence: 0.7, shape: null as "rectangular" | "square" | "L-shaped" | "narrow_corridor" | "irregular" | null,
        notes: "Piece humide" as string | null,
      },
    ];

    const result = await createRoomsFromExtraction("proj-1", "lot-1", extractedRooms);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Salon");
    expect(result[1].name).toBe("Cuisine");
  });

  it("marque is_estimated true quand dimensions null", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "r1", is_estimated: true, name: "Couloir",
      }],
    });

    await createRoomsFromExtraction("proj-1", null, [
      {
        temp_id: "r1", name_raw: "Couloir", surface_m2: 8 as number | null,
        dimensions: null as { length_m: number; width_m: number } | null,
        ceiling_height_m: null as number | null,
        windows_count: 0, doors_count: 2, floor: 0 as number | null,
        confidence: 0.5, shape: "narrow_corridor" as const,
        notes: null as string | null,
      },
    ]);

    const insertCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("INSERT INTO pro_rooms")
    );
    expect(insertCall).toBeDefined();
    // is_estimated is the 13th parameter (index 12) — true when dimensions is null
    expect(insertCall![1][12]).toBe(true);
  });

  it("marque is_estimated false quand dimensions presentes", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "r1", is_estimated: false }],
    });

    await createRoomsFromExtraction("proj-1", null, [
      {
        temp_id: "r1", name_raw: "Salon", surface_m2: 25 as number | null,
        dimensions: { length_m: 5, width_m: 5 } as { length_m: number; width_m: number } | null,
        ceiling_height_m: 2.5 as number | null,
        windows_count: 1, doors_count: 1, floor: 0 as number | null,
        confidence: 0.9, shape: "rectangular" as const,
        notes: null as string | null,
      },
    ]);

    const insertCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("INSERT INTO pro_rooms")
    );
    expect(insertCall![1][12]).toBe(false);
  });
});

describe("getRoomsByProject", () => {
  it("retourne les rooms du projet", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: "r1", project_id: "proj-1", name: "Salon" },
        { id: "r2", project_id: "proj-1", name: "Cuisine" },
      ],
    });

    const result = await getRoomsByProject("proj-1");
    expect(result).toHaveLength(2);
  });
});

describe("getRoomsByLot", () => {
  it("retourne les rooms du lot", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "r1", lot_id: "lot-1", name: "Chambre" }],
    });

    const result = await getRoomsByLot("lot-1");
    expect(result).toHaveLength(1);
    expect(result[0].lot_id).toBe("lot-1");
  });
});

describe("getRoom", () => {
  it("retourne une room par id", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "r1", name: "Bureau" }],
    });

    const result = await getRoom("r1");
    expect(result).toBeDefined();
    expect(result!.name).toBe("Bureau");
  });

  it("retourne null si room introuvable", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const result = await getRoom("nonexistent");
    expect(result).toBeNull();
  });
});

describe("updateRoom", () => {
  it("met a jour les champs partiels", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    await updateRoom("r1", { room_type: "salon", surface_m2: 30 });

    const updateCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("UPDATE pro_rooms SET")
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![0]).toContain("room_type");
    expect(updateCall![0]).toContain("surface_m2");
  });

  it("ne fait rien si aucun champ", async () => {
    await updateRoom("r1", {});
    const updateCalls = queryMock.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("UPDATE pro_rooms")
    );
    expect(updateCalls).toHaveLength(0);
  });
});

// ─── Recommendation CRUD ──────────────────────────────────────────

describe("createRecommendations", () => {
  it("desactive les anciennes recs puis insere les nouvelles", async () => {
    // 1st call: deactivate old recs
    queryMock.mockResolvedValueOnce({ rows: [] });
    // 2nd call: get max version
    queryMock.mockResolvedValueOnce({ rows: [{ max_version: 1 }] });
    // 3rd call: insert rec 1
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "rec-uuid-1",
        lot_id: "lot-1",
        title: "Ouvrir cuisine",
        description: "Supprimer la cloison entre la cuisine et le salon pour un espace de vie plus genereux.",
        action_type: "cloison",
        estimated_cost_eur: 3500,
        impact_level: "haute",
        affected_rooms: ["r1", "r2"],
        rationale_buyer: "Espace ouvert",
        is_accepted: null,
        is_active: true,
        version: 2,
        created_at: new Date(),
      }],
    });

    const result = await createRecommendations("lot-1", [
      {
        title: "Ouvrir cuisine",
        description: "Supprimer la cloison entre la cuisine et le salon pour un espace de vie plus genereux.",
        action_type: "cloison",
        estimated_cost_eur: 3500,
        impact_level: "haute",
        affected_rooms: ["r1", "r2"],
        rationale_buyer: "Espace ouvert",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].version).toBe(2);

    // Verify deactivation was called
    const deactivateCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("SET is_active = FALSE")
    );
    expect(deactivateCall).toBeDefined();
  });

  it("premiere version si aucune rec precedente (max_version null)", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] }); // deactivate
    queryMock.mockResolvedValueOnce({ rows: [{ max_version: null }] }); // max version
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "rec-1", version: 1, title: "Test",
        description: "Une description suffisamment longue pour passer la validation.",
        action_type: "deco", estimated_cost_eur: 500,
        impact_level: "basse", affected_rooms: ["r1"],
        rationale_buyer: "Test", lot_id: "lot-1",
        is_accepted: null, is_active: true, created_at: new Date(),
      }],
    });

    const result = await createRecommendations("lot-1", [{
      title: "Test",
      description: "Une description suffisamment longue pour passer la validation.",
      action_type: "deco",
      estimated_cost_eur: 500,
      impact_level: "basse",
      affected_rooms: ["r1"],
      rationale_buyer: "Test",
    }]);

    expect(result[0].version).toBe(1);
  });
});

describe("getActiveRecommendations", () => {
  it("retourne les recs actives du lot", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { id: "rec-1", lot_id: "lot-1", is_active: true, impact_level: "haute" },
        { id: "rec-2", lot_id: "lot-1", is_active: true, impact_level: "moyenne" },
      ],
    });

    const result = await getActiveRecommendations("lot-1");
    expect(result).toHaveLength(2);
  });
});

describe("updateRecommendationAcceptance", () => {
  it("met a jour is_accepted a true", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    await updateRecommendationAcceptance("rec-1", true);

    const updateCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("UPDATE pro_recommendations SET is_accepted")
    );
    expect(updateCall).toBeDefined();
    expect(updateCall![1][0]).toBe(true);
    expect(updateCall![1][1]).toBe("rec-1");
  });

  it("met a jour is_accepted a false", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    await updateRecommendationAcceptance("rec-2", false);

    const updateCall = queryMock.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("UPDATE pro_recommendations SET is_accepted")
    );
    expect(updateCall![1][0]).toBe(false);
  });
});

// ─── Share links ──────────────────────────────────────────────────

describe("createShareLink", () => {
  it("cree un share link", async () => {
    const expires = new Date("2026-05-01T00:00:00Z");
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "sl-1", lot_id: "lot-1", token: "abc123",
        expires_at: expires, is_active: true,
        created_at: new Date(), last_accessed_at: null,
      }],
    });

    const result = await createShareLink("lot-1", "abc123", expires);
    expect(result.token).toBe("abc123");
    expect(result.is_active).toBe(true);
  });
});

describe("getShareLinkByToken", () => {
  it("retourne le link si actif et non expire", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: "sl-1", lot_id: "lot-1", token: "abc123",
        is_active: true, expires_at: new Date("2026-12-31"),
      }],
    });
    // The fire-and-forget update for last_accessed_at
    queryMock.mockResolvedValueOnce({ rows: [] });

    const result = await getShareLinkByToken("abc123");
    expect(result).toBeDefined();
    expect(result!.token).toBe("abc123");
  });

  it("retourne null si token introuvable", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const result = await getShareLinkByToken("nonexistent");
    expect(result).toBeNull();
  });
});

describe("getActiveShareLink", () => {
  it("retourne le link actif le plus recent", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: "sl-2", lot_id: "lot-1", token: "xyz789", is_active: true }],
    });

    const result = await getActiveShareLink("lot-1");
    expect(result).toBeDefined();
    expect(result!.token).toBe("xyz789");
  });
});

// ─── Ownership ─────────────────────────────────────────────────────

describe("verifyProjectOwnership", () => {
  it("retourne true si l'utilisateur est proprietaire", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ count: "1" }] });

    const result = await verifyProjectOwnership("proj-1", "user-1");
    expect(result).toBe(true);
  });

  it("retourne false si l'utilisateur n'est pas proprietaire", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ count: "0" }] });

    const result = await verifyProjectOwnership("proj-1", "user-other");
    expect(result).toBe(false);
  });
});
