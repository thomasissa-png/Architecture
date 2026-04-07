/**
 * R1 — multi-photo-scheduler.ts — Tests unitaires
 *
 * Vérifie la logique de scheduling pure extraite de app/page.tsx :
 * - Parallélisation bornée par MAX_CONCURRENT
 * - Préservation de l'ordre fileIndex
 * - Comportement avec AbortController
 * - Classification succès / failed / aborted
 */
import { describe, it, expect, vi } from "vitest";
import {
  runParallelPhotoJobs,
  type PhotoJob,
} from "@/lib/multi-photo-scheduler";

function makeJob(fileIndex: number, styleId = "scandinave"): PhotoJob<{ id: number }> {
  return { fileIndex, styleId, payload: { id: fileIndex } };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("R1 — runParallelPhotoJobs", () => {
  it("U-MPS-001: 0 jobs → résultat vide", async () => {
    const executor = vi.fn(async () => "ok");
    const result = await runParallelPhotoJobs([], executor);
    expect(result.successful).toEqual([]);
    expect(result.failed).toEqual([]);
    expect(result.aborted).toEqual([]);
    expect(result.wasAborted).toBe(false);
    expect(executor).not.toHaveBeenCalled();
  });

  it("U-MPS-002: tous les jobs réussissent → successful complet, triés par fileIndex", async () => {
    const jobs = [makeJob(2), makeJob(0), makeJob(1)];
    const executor = async (j: PhotoJob<{ id: number }>) => `result-${j.fileIndex}`;
    const result = await runParallelPhotoJobs(jobs, executor);
    expect(result.successful.map((s) => s.job.fileIndex)).toEqual([0, 1, 2]);
    expect(result.successful.map((s) => s.value)).toEqual([
      "result-0",
      "result-1",
      "result-2",
    ]);
    expect(result.failed).toEqual([]);
  });

  it("U-MPS-003: MAX_CONCURRENT=2 → max 2 jobs en parallèle", async () => {
    const jobs = Array.from({ length: 5 }, (_, i) => makeJob(i));
    let active = 0;
    let maxActive = 0;
    const executor = async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await delay(20);
      active--;
      return "ok";
    };
    const result = await runParallelPhotoJobs(jobs, executor, { maxConcurrent: 2 });
    expect(result.successful.length).toBe(5);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("U-MPS-004: défaut MAX_CONCURRENT=5 (session 33)", async () => {
    const jobs = Array.from({ length: 7 }, (_, i) => makeJob(i));
    let active = 0;
    let maxActive = 0;
    const executor = async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await delay(10);
      active--;
      return "ok";
    };
    await runParallelPhotoJobs(jobs, executor);
    expect(maxActive).toBeLessThanOrEqual(5);
    expect(maxActive).toBeGreaterThan(2); // sinon on est revenu à l'ancien 2
  });

  it("U-MPS-005: jobs mixtes succès/échec → classification correcte", async () => {
    const jobs = [makeJob(0), makeJob(1), makeJob(2)];
    const executor = async (j: PhotoJob<{ id: number }>) => {
      if (j.fileIndex === 1) throw new Error("boom");
      return "ok";
    };
    const result = await runParallelPhotoJobs(jobs, executor);
    expect(result.successful.map((s) => s.job.fileIndex)).toEqual([0, 2]);
    expect(result.failed.map((f) => f.job.fileIndex)).toEqual([1]);
    expect(result.failed[0].reason.message).toBe("boom");
    expect(result.aborted).toEqual([]);
  });

  it("U-MPS-006: AbortError → classé dans aborted, pas failed", async () => {
    const jobs = [makeJob(0), makeJob(1)];
    const executor = async (j: PhotoJob<{ id: number }>) => {
      if (j.fileIndex === 1) {
        const err = new Error("fetch aborted");
        err.name = "AbortError";
        throw err;
      }
      return "ok";
    };
    const result = await runParallelPhotoJobs(jobs, executor);
    expect(result.successful.length).toBe(1);
    expect(result.failed.length).toBe(0);
    expect(result.aborted.length).toBe(1);
    expect(result.aborted[0].aborted).toBe(true);
    expect(result.wasAborted).toBe(true);
  });

  it("U-MPS-007: abortSignal déclenché avant le 2ème batch → reste classé aborted", async () => {
    const controller = new AbortController();
    const jobs = Array.from({ length: 6 }, (_, i) => makeJob(i));
    const executor = async (j: PhotoJob<{ id: number }>) => {
      if (j.fileIndex === 1) {
        // Abort pendant le premier batch (maxConcurrent=3 → jobs 0,1,2)
        controller.abort();
      }
      return `ok-${j.fileIndex}`;
    };
    const result = await runParallelPhotoJobs(jobs, executor, {
      maxConcurrent: 3,
      abortSignal: controller.signal,
    });
    // Les 3 jobs du premier batch ont eu le temps de s'exécuter
    expect(result.successful.length).toBeGreaterThanOrEqual(3);
    // Les 3 du second batch n'ont jamais démarré → aborted
    expect(result.aborted.length).toBeGreaterThanOrEqual(3);
    expect(result.wasAborted).toBe(true);
    // Vérifier que les jobs aborted sont bien ceux d'index >= 3
    for (const ab of result.aborted) {
      expect(ab.job.fileIndex).toBeGreaterThanOrEqual(3);
    }
  });

  it("U-MPS-008: callbacks onJobStart/onJobComplete sont appelés", async () => {
    const jobs = [makeJob(0), makeJob(1)];
    const onJobStart = vi.fn();
    const onJobComplete = vi.fn();
    const executor = async () => "ok";
    await runParallelPhotoJobs(jobs, executor, { onJobStart, onJobComplete });
    expect(onJobStart).toHaveBeenCalledTimes(2);
    expect(onJobComplete).toHaveBeenCalledTimes(2);
  });

  it("U-MPS-009: ordre fileIndex préservé même si l'executor complète dans le désordre", async () => {
    const jobs = [makeJob(0), makeJob(1), makeJob(2)];
    const executor = async (j: PhotoJob<{ id: number }>) => {
      // Job 0 met plus de temps que les autres
      await delay(j.fileIndex === 0 ? 30 : 5);
      return `r-${j.fileIndex}`;
    };
    const result = await runParallelPhotoJobs(jobs, executor, { maxConcurrent: 3 });
    expect(result.successful.map((s) => s.job.fileIndex)).toEqual([0, 1, 2]);
  });

  it("U-MPS-010: maxConcurrent=0 ou négatif → fallback à 1 (défense)", async () => {
    const jobs = [makeJob(0), makeJob(1)];
    const executor = vi.fn(async () => "ok");
    const result = await runParallelPhotoJobs(jobs, executor, { maxConcurrent: 0 });
    expect(result.successful.length).toBe(2);
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it("U-MPS-011: executor reçoit le job + le signal", async () => {
    const controller = new AbortController();
    const jobs = [makeJob(0)];
    const executor = vi.fn(async (_j, signal?: AbortSignal) => {
      expect(signal).toBe(controller.signal);
      return "ok";
    });
    await runParallelPhotoJobs(jobs, executor, { abortSignal: controller.signal });
    expect(executor).toHaveBeenCalledWith(jobs[0], controller.signal);
  });
});
