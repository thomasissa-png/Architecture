/**
 * Multi-photo scheduler — pure scheduling logic extraite de app/page.tsx.
 *
 * Historiquement la logique de scheduling multi-photo (parallélisation,
 * MAX_CONCURRENT, Promise.allSettled, préservation de l'ordre fileIndex)
 * était inline dans handleGenerate (app/page.tsx ligne 711). Impossible à
 * tester en isolation sans monter tout le composant React.
 *
 * Cette extraction sépare :
 * - Le SCHEDULING pur (ordonnancement, concurrence, abort, allSettled)
 * - L'EXÉCUTION d'un job (fetch, parsing, setState) qui reste dans page.tsx
 *
 * L'executor est injecté → testable avec des mocks déterministes.
 *
 * Règles session 33 :
 * - MAX_CONCURRENT = 5 (au lieu de 2 avant) : l'utilisateur voit TOUS les
 *   visuels démarrer en même temps quand il lance moins de 6 photos.
 * - L'ordre des résultats préserve `fileIndex` (pas l'ordre de complétion).
 * - AbortController abort = les jobs en cours finissent, les suivants sont
 *   annulés avant dispatch.
 *
 * Note d'intégration : app/page.tsx n'utilise PAS encore cette fonction.
 * Câblage dans une passe ultérieure (minimise risque de régression sur un
 * fichier de 3141 lignes partagé avec @qa).
 */

export interface PhotoJob<TPayload = unknown> {
  /** Index du fichier dans la liste uploadée — utilisé pour préserver l'ordre */
  fileIndex: number;
  /** Identifiant du style (pour logging/tests) */
  styleId: string;
  /** Payload arbitraire passé à l'executor (ex: base64, prompt, dimensions) */
  payload: TPayload;
}

export interface JobSuccess<TPayload, TResult> {
  status: "fulfilled";
  job: PhotoJob<TPayload>;
  value: TResult;
}

export interface JobFailure<TPayload> {
  status: "rejected";
  job: PhotoJob<TPayload>;
  reason: Error;
  /** True si l'erreur vient d'un AbortController.abort() */
  aborted: boolean;
}

export type JobOutcome<TPayload, TResult> =
  | JobSuccess<TPayload, TResult>
  | JobFailure<TPayload>;

export interface SchedulerOptions {
  /** Nombre maximum de jobs exécutés en parallèle (défaut : 5 — session 33) */
  maxConcurrent?: number;
  /** Signal d'abort — propagé à chaque executor */
  abortSignal?: AbortSignal;
  /** Callback optionnel pour tracker la progression (UI loading states) */
  onJobStart?: (job: PhotoJob) => void;
  /** Callback optionnel appelé quand un job termine (succès ou échec) */
  onJobComplete?: (outcome: JobOutcome<unknown, unknown>) => void;
}

export interface SchedulerResult<TPayload, TResult> {
  /** Liste des jobs complétés avec succès, triée par fileIndex croissant */
  successful: JobSuccess<TPayload, TResult>[];
  /** Liste des jobs échoués (hors abort), triée par fileIndex croissant */
  failed: JobFailure<TPayload>[];
  /** Liste des jobs annulés par abort, triée par fileIndex croissant */
  aborted: JobFailure<TPayload>[];
  /** True si au moins un job a été annulé */
  wasAborted: boolean;
}

const DEFAULT_MAX_CONCURRENT = 5;

function isAbortError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === "AbortError" || err.message === "Aborted";
}

/**
 * Exécute une liste de jobs photo en parallèle avec une concurrence bornée.
 *
 * Contrats :
 * - Traitement par batches de `maxConcurrent` jobs via Promise.allSettled
 * - Si `abortSignal` est déclenché pendant un batch, les jobs restants ne
 *   sont PAS démarrés (les jobs en cours finissent ou rejettent AbortError)
 * - Résultats retournés triés par `fileIndex` croissant, PAS par ordre de
 *   complétion (stabilité visuelle dans la galerie)
 * - Un executor qui throw → job classé "failed" (ou "aborted" si AbortError)
 * - Idempotent : appeler 2 fois avec les mêmes jobs et le même executor
 *   déterministe retourne les mêmes outcomes
 *
 * @param jobs Liste des jobs à exécuter
 * @param executor Fonction asynchrone qui exécute un job et retourne le résultat
 * @param options Options de scheduling (maxConcurrent, abortSignal, callbacks)
 */
export async function runParallelPhotoJobs<TPayload, TResult>(
  jobs: PhotoJob<TPayload>[],
  executor: (job: PhotoJob<TPayload>, signal?: AbortSignal) => Promise<TResult>,
  options: SchedulerOptions = {},
): Promise<SchedulerResult<TPayload, TResult>> {
  const maxConcurrent = Math.max(1, options.maxConcurrent ?? DEFAULT_MAX_CONCURRENT);
  const signal = options.abortSignal;

  const successful: JobSuccess<TPayload, TResult>[] = [];
  const failed: JobFailure<TPayload>[] = [];
  const aborted: JobFailure<TPayload>[] = [];

  if (jobs.length === 0) {
    return { successful, failed, aborted, wasAborted: false };
  }

  for (let batchStart = 0; batchStart < jobs.length; batchStart += maxConcurrent) {
    if (signal?.aborted) {
      // Reste des jobs non-démarrés → marqués aborted
      const remaining = jobs.slice(batchStart);
      for (const job of remaining) {
        const outcome: JobFailure<TPayload> = {
          status: "rejected",
          job,
          reason: new Error("Aborted before dispatch"),
          aborted: true,
        };
        aborted.push(outcome);
        options.onJobComplete?.(outcome as JobFailure<unknown>);
      }
      break;
    }

    const chunk = jobs.slice(batchStart, batchStart + maxConcurrent);
    chunk.forEach((job) => options.onJobStart?.(job as PhotoJob));

    const settled = await Promise.allSettled(
      chunk.map((job) => executor(job, signal)),
    );

    for (let i = 0; i < settled.length; i++) {
      const result = settled[i];
      const job = chunk[i];
      if (result.status === "fulfilled") {
        const outcome: JobSuccess<TPayload, TResult> = {
          status: "fulfilled",
          job,
          value: result.value,
        };
        successful.push(outcome);
        options.onJobComplete?.(outcome as JobSuccess<unknown, unknown>);
      } else {
        const reason = result.reason instanceof Error
          ? result.reason
          : new Error(String(result.reason));
        const isAbort = isAbortError(reason) || signal?.aborted === true;
        const outcome: JobFailure<TPayload> = {
          status: "rejected",
          job,
          reason,
          aborted: isAbort,
        };
        if (isAbort) {
          aborted.push(outcome);
        } else {
          failed.push(outcome);
        }
        options.onJobComplete?.(outcome as JobFailure<unknown>);
      }
    }
  }

  // Tri par fileIndex croissant pour préserver l'ordre d'affichage
  const byFileIndex = <T extends { job: PhotoJob<TPayload> }>(a: T, b: T) =>
    a.job.fileIndex - b.job.fileIndex;
  successful.sort(byFileIndex);
  failed.sort(byFileIndex);
  aborted.sort(byFileIndex);

  return {
    successful,
    failed,
    aborted,
    wasAborted: aborted.length > 0 || signal?.aborted === true,
  };
}
