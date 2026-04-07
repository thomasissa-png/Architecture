/**
 * BR-1 — Compteur "Génération en cours (1/3)" alors que les 3 tournent en parallèle
 *
 * TDD : ces tests décrivent le comportement attendu d'une fonction
 * `formatProgressLabel` à extraire de app/page.tsx vers lib/multi-photo-scheduler.ts
 * (refactor R1 — bloquant pour ces tests).
 *
 * Symptôme reproduit dans page.tsx ligne 2307 :
 *   `Génération en cours… (${results.length + 1}/${total})`
 * → affiche "1/3" alors que les 3 tournent en parallèle (MAX_CONCURRENT=5).
 *
 * Fix attendu (R1) : extraire `formatProgressLabel(jobs)` qui prend l'état réel
 * des jobs et retourne un label basé sur `in_progress.length`.
 *
 * Statut : SKIPPED jusqu'à extraction R1. Le test doit échouer dès que
 * `lib/multi-photo-scheduler.ts` existera mais que la fonction n'aura pas
 * la bonne logique.
 */
import { describe, it, expect } from "vitest";

interface Job {
  fileIndex: number;
  status: "pending" | "in_progress" | "completed" | "error" | "aborted";
}

// BLOCKED: R1 multi-photo-scheduler.ts extraction needed
// Once @fullstack extracts: import { formatProgressLabel } from "@/lib/multi-photo-scheduler";
describe.skip("BR-1 — formatProgressLabel (BLOCKED: R1 extraction)", () => {
  // Local stub for the expected signature — replace with real import after R1
  function formatProgressLabel(jobs: Job[]): string {
    const inProgress = jobs.filter((j) => j.status === "in_progress").length;
    const completed = jobs.filter((j) => j.status === "completed").length;
    const total = jobs.length;
    if (inProgress === 0 && completed === total) return "Terminé";
    if (inProgress > 1) return `Génération en cours (${inProgress} en parallèle)`;
    return `Génération en cours (${completed + 1}/${total})`;
  }

  it("U-BR1-001: 3 jobs in_progress → '3 en parallèle' (PAS '1/3')", () => {
    const jobs: Job[] = [
      { fileIndex: 0, status: "in_progress" },
      { fileIndex: 1, status: "in_progress" },
      { fileIndex: 2, status: "in_progress" },
    ];
    const label = formatProgressLabel(jobs);
    expect(label).toMatch(/3 en parallèle/);
    expect(label).not.toMatch(/1\/3/);
  });

  it("U-BR1-002: 1 in_progress + 2 completed → reflet état réel", () => {
    const jobs: Job[] = [
      { fileIndex: 0, status: "completed" },
      { fileIndex: 1, status: "completed" },
      { fileIndex: 2, status: "in_progress" },
    ];
    const label = formatProgressLabel(jobs);
    // Acceptable : "3/3" car 2 completed + 1 in_progress (la 3e en cours est la 3e qui sera completed)
    // L'important : ne PAS afficher "1/3"
    expect(label).not.toMatch(/^Génération en cours \(1\/3\)$/);
  });

  it("BR-1 ne doit PAS apparaître pour un upload single (1 photo)", () => {
    const jobs: Job[] = [{ fileIndex: 0, status: "in_progress" }];
    const label = formatProgressLabel(jobs);
    // Pour 1 seule photo, "1/1" ou "Génération en cours" sont acceptables
    expect(label).toMatch(/Génération/);
  });
});

/**
 * Test alternatif NON-skippé : on Grep le source actuel pour détecter
 * la régression. Si la chaîne fautive est encore là, ce test échoue
 * et signale BR-1 sans avoir besoin de l'extraction R1.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("BR-1 — détection statique régression dans app/page.tsx", () => {
  it("le label de progression NE doit PAS lire 'results.length + 1' (utiliser un compteur jobs)", () => {
    const src = readFileSync(join(process.cwd(), "app/page.tsx"), "utf-8");
    // La ligne fautive originale était :
    //   Génération en cours… ({results.length + 1}/{total})
    // Le fix doit être un compteur basé sur l'état réel des jobs.
    // Tant que ce test échoue, BR-1 n'est pas fixé.
    const hasFaulty = /G[ée]n[ée]ration en cours.*results\.length\s*\+\s*1\s*\}/.test(src);
    expect(
      hasFaulty,
      "BR-1 régression : le label affiche encore 'results.length + 1' au lieu d'un compteur jobs basé sur in_progress",
    ).toBe(false);
  });
});
