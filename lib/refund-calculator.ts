/**
 * Refund calculator — pure logic for credit refund on partial/total failure.
 *
 * Historiquement cette logique était inline dans app/page.tsx `handleGenerate`
 * (sessions 27 à 33). Extraction en fonction pure pour :
 * - Tester les cas limites en isolation (0 succès, tous succès, abort total)
 * - Documenter la règle métier : on ne facture que ce qui a produit un résultat
 * - Permettre à `@qa` d'asserter le comportement sans monter tout le pipeline
 *
 * Règle fondateur (session 27) : si un job échoue après décompte des crédits,
 * le crédit DOIT être restitué au centime près. L'utilisateur ne paie jamais
 * pour un échec serveur — on préfère un refund excessif à une frustration.
 *
 * Note d'intégration : app/page.tsx n'appelle PAS encore cette fonction.
 * Le câblage sera fait dans une passe ultérieure pour minimiser le risque
 * de régression sur un fichier de 3141 lignes. Cette extraction sert de
 * spec exécutable + base de tests.
 */

export interface RefundInput {
  /** Nombre total de jobs planifiés (= crédits consommés upfront) */
  totalJobs: number;
  /** Nombre de jobs ayant produit un résultat utilisable */
  successfulJobs: number;
  /** True si l'utilisateur a annulé (AbortController). Refund total. */
  aborted?: boolean;
}

export interface RefundOutput {
  /** Nombre de crédits à restituer (entier, >= 0) */
  refundedCredits: number;
  /** Raison machine-readable pour logging/tests */
  reason: "all-success" | "partial-failure" | "total-failure" | "aborted";
  /** Message utilisateur prêt à afficher dans un toast (FR, UX-writing compliant) */
  userMessage: string | null;
}

/**
 * Calcule le remboursement à appliquer après un batch de génération.
 *
 * Contrats :
 * - Idempotent : appeler 2 fois avec les mêmes inputs retourne la même sortie
 * - totalJobs === 0 → refund 0, reason "all-success", message null
 * - successfulJobs > totalJobs → clampé à totalJobs (défense en profondeur)
 * - aborted === true → refund = (totalJobs - successfulJobs), reason "aborted"
 * - successfulJobs === totalJobs → refund 0
 * - successfulJobs === 0 → refund total, reason "total-failure"
 * - 0 < successfulJobs < totalJobs → refund partiel, reason "partial-failure"
 */
export function calculateRefund(input: RefundInput): RefundOutput {
  const total = Math.max(0, Math.floor(input.totalJobs));
  const success = Math.max(0, Math.min(total, Math.floor(input.successfulJobs)));
  const aborted = input.aborted === true;

  if (total === 0) {
    return { refundedCredits: 0, reason: "all-success", userMessage: null };
  }

  if (aborted) {
    const refund = total - success;
    if (refund === 0) {
      return { refundedCredits: 0, reason: "all-success", userMessage: null };
    }
    return {
      refundedCredits: refund,
      reason: "aborted",
      userMessage: `Génération annulée. ${refund} visuel${refund > 1 ? "s" : ""} remboursé${refund > 1 ? "s" : ""}.`,
    };
  }

  if (success === total) {
    return { refundedCredits: 0, reason: "all-success", userMessage: null };
  }

  if (success === 0) {
    return {
      refundedCredits: total,
      reason: "total-failure",
      userMessage: `Échec de la génération. ${total} crédit${total > 1 ? "s" : ""} remboursé${total > 1 ? "s" : ""}.`,
    };
  }

  const refund = total - success;
  return {
    refundedCredits: refund,
    reason: "partial-failure",
    userMessage: `${success}/${total} génération${total > 1 ? "s" : ""} réussie${success > 1 ? "s" : ""}. ${refund} visuel${refund > 1 ? "s" : ""} remboursé${refund > 1 ? "s" : ""}.`,
  };
}
