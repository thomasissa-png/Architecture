/**
 * R2 — refund-calculator.ts — Tests unitaires
 *
 * Coverage : tous les cas de figure de la règle de remboursement session 27.
 * Ces tests remplacent la suite R1-R4 "skipped" en attendant le câblage
 * dans app/page.tsx.
 */
import { describe, it, expect } from "vitest";
import { calculateRefund } from "@/lib/refund-calculator";

describe("R2 — calculateRefund", () => {
  it("U-RF-001: tous les jobs réussissent → aucun remboursement", () => {
    const r = calculateRefund({ totalJobs: 3, successfulJobs: 3 });
    expect(r.refundedCredits).toBe(0);
    expect(r.reason).toBe("all-success");
    expect(r.userMessage).toBeNull();
  });

  it("U-RF-002: échec total → remboursement total", () => {
    const r = calculateRefund({ totalJobs: 4, successfulJobs: 0 });
    expect(r.refundedCredits).toBe(4);
    expect(r.reason).toBe("total-failure");
    expect(r.userMessage).toMatch(/4 crédits remboursés/);
  });

  it("U-RF-003: échec partiel → remboursement des jobs échoués uniquement", () => {
    const r = calculateRefund({ totalJobs: 5, successfulJobs: 3 });
    expect(r.refundedCredits).toBe(2);
    expect(r.reason).toBe("partial-failure");
    expect(r.userMessage).toMatch(/3\/5/);
    expect(r.userMessage).toMatch(/2 visuels remboursés/);
  });

  it("U-RF-004: abort avant tout succès → remboursement total avec reason aborted", () => {
    const r = calculateRefund({ totalJobs: 3, successfulJobs: 0, aborted: true });
    expect(r.refundedCredits).toBe(3);
    expect(r.reason).toBe("aborted");
    expect(r.userMessage).toMatch(/annulée/);
  });

  it("U-RF-005: abort après succès partiel → remboursement des jobs non complétés", () => {
    const r = calculateRefund({ totalJobs: 5, successfulJobs: 2, aborted: true });
    expect(r.refundedCredits).toBe(3);
    expect(r.reason).toBe("aborted");
  });

  it("U-RF-006: abort alors que tout était déjà fini → pas de refund", () => {
    const r = calculateRefund({ totalJobs: 3, successfulJobs: 3, aborted: true });
    expect(r.refundedCredits).toBe(0);
    expect(r.reason).toBe("all-success");
  });

  it("U-RF-007: totalJobs === 0 → aucun remboursement, pas de message", () => {
    const r = calculateRefund({ totalJobs: 0, successfulJobs: 0 });
    expect(r.refundedCredits).toBe(0);
    expect(r.reason).toBe("all-success");
    expect(r.userMessage).toBeNull();
  });

  it("U-RF-008: singuliers FR corrects pour 1 visuel", () => {
    const r = calculateRefund({ totalJobs: 1, successfulJobs: 0 });
    expect(r.userMessage).toMatch(/1 crédit remboursé\.$/);
    expect(r.userMessage).not.toMatch(/crédits/);
  });

  it("U-RF-009: idempotence — même inputs = mêmes outputs", () => {
    const input = { totalJobs: 7, successfulJobs: 4 };
    const r1 = calculateRefund(input);
    const r2 = calculateRefund(input);
    expect(r1).toEqual(r2);
  });

  it("U-RF-010: successfulJobs > totalJobs → clampé à totalJobs (défense)", () => {
    const r = calculateRefund({ totalJobs: 3, successfulJobs: 99 });
    expect(r.refundedCredits).toBe(0);
    expect(r.reason).toBe("all-success");
  });

  it("U-RF-011: valeurs négatives → clampées à 0", () => {
    const r = calculateRefund({ totalJobs: -5, successfulJobs: -2 });
    expect(r.refundedCredits).toBe(0);
    expect(r.reason).toBe("all-success");
  });

  it("U-RF-012: floats → floor appliqué", () => {
    const r = calculateRefund({ totalJobs: 4.9, successfulJobs: 1.7 });
    expect(r.refundedCredits).toBe(3);
    expect(r.reason).toBe("partial-failure");
  });
});
