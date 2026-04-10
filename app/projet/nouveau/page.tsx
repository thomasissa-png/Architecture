"use client";

/**
 * Page création projet marchand + paiement (Étape 1).
 *
 * Rendu : Client Component — formulaire interactif avec upload et paiement.
 *
 * Flow : Thomas saisit l'adresse, le type de bien, la surface,
 * uploade le plan (PDF/JPG/PNG), puis crée le projet (gratuit pendant la bêta).
 * Après création : redirect vers /projet/[id]/extraction.
 */

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProStepper from "@/components/marchand/ProStepper";
import AuthModal from "@/components/AuthModal";

// ─── Constants ──────────────────────────────────────────────────────

const TYPE_BIEN_OPTIONS = [
  { value: "appartement", label: "Appartement" },
  { value: "immeuble", label: "Immeuble" },
  { value: "maison", label: "Maison" },
  { value: "bureaux", label: "Bureaux" },
  { value: "local_commercial", label: "Local commercial" },
] as const;

const ACCEPTED_PLAN_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
// Pricing removed — free during beta (founder decision session 41)

// ─── Helpers ───────────────────────────────────────────────────────

/** Vérifie si l'utilisateur connecté est abonné Pro avec crédits restants. */
function useProStatus(session: ReturnType<typeof useSession>["data"]) {
  const user = session?.user as
    | (Record<string, unknown> & { role?: string; credits_remaining?: number })
    | undefined;
  const isPro = user?.role === "pro";
  const creditsRemaining = typeof user?.credits_remaining === "number" ? user.credits_remaining : 0;
  return { isPro, creditsRemaining, hasCredits: isPro && creditsRemaining > 0 };
}

// ─── Component ──────────────────────────────────────────────────────

export default function NouveauProjetPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { hasCredits } = useProStatus(session);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [adresse, setAdresse] = useState("");
  const [typeBien, setTypeBien] = useState("appartement");
  const [surface, setSurface] = useState("");
  const [planFile, setPlanFile] = useState<File | null>(null);
  const [planPreviewUrl, setPlanPreviewUrl] = useState<string | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ─── Plan file handling ───────────────────────────────────────────

  const handlePlanSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    const allowedTypes = ACCEPTED_PLAN_TYPES.split(",");
    if (!allowedTypes.includes(file.type)) {
      setError("Format accepté : PDF, JPG, PNG, WEBP, HEIC.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Le fichier ne doit pas dépasser ${MAX_FILE_SIZE_MB} Mo.`);
      return;
    }

    setError(null);
    setPlanFile(file);

    // Preview for images (not PDF)
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPlanPreviewUrl(url);
    } else {
      setPlanPreviewUrl(null);
    }
  }, []);

  const handleRemovePlan = useCallback(() => {
    setPlanFile(null);
    if (planPreviewUrl) {
      URL.revokeObjectURL(planPreviewUrl);
      setPlanPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [planPreviewUrl]);

  // ─── Drag & drop ─────────────────────────────────────────────────

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Validate MIME type (drag & drop bypasses input accept attribute)
    const allowedTypes = ACCEPTED_PLAN_TYPES.split(",");
    if (!allowedTypes.includes(file.type)) {
      setError("Format accepté : PDF, JPG, PNG, WEBP, HEIC.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Le fichier ne doit pas dépasser ${MAX_FILE_SIZE_MB} Mo.`);
      return;
    }

    setError(null);
    setPlanFile(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPlanPreviewUrl(url);
    } else {
      setPlanPreviewUrl(null);
    }
  }, []);

  // ─── Form submission ─────────────────────────────────────────────

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    if (!planFile) {
      setError("Le plan du bien est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const formData = new FormData();
      formData.append("adresse", adresse.trim());
      formData.append("type_bien", typeBien);
      if (surface) {
        formData.append("surface_totale", surface);
      }
      formData.append("plan_file", planFile);

      const response = await fetch("/api/pro/projects", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fields) {
          setFieldErrors(data.fields);
        } else {
          setError(data.message || "Erreur lors de la création du projet.");
        }
        return;
      }

      // Success — redirect to extraction
      const projectId = data.project_id;
      router.push(`/projet/${projectId}/extraction`);
    } catch {
      setError("Erreur de connexion. Vérifiez votre réseau et réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  }, [session, planFile, adresse, typeBien, surface, router]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Header variant="internal" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <ProStepper currentStep={1} completedSteps={[]} />
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
            Nouveau bien
          </h1>
          <p className="text-sm text-[#9B9A94] mt-1">
            Renseignez les informations de votre bien et déposez le plan.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Adresse */}
          <div>
            <label
              htmlFor="adresse"
              className="block text-sm font-medium text-[#1C1C1E] mb-1.5"
            >
              Adresse du bien
            </label>
            <input
              id="adresse"
              type="text"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex : 12 rue de la Paix, 33000 Bordeaux"
              required
              minLength={5}
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D1D0CB] bg-white
                         text-sm text-[#1C1C1E] placeholder-[#9B9A94]
                         focus:outline-none focus:ring-2 focus:ring-[#7D9B76] focus:border-transparent
                         transition-shadow"
            />
            {fieldErrors.adresse && (
              <p className="mt-1 text-xs text-[#B91C1C]" role="alert">
                {fieldErrors.adresse[0]}
              </p>
            )}
          </div>

          {/* Type de bien */}
          <div>
            <label
              htmlFor="type_bien"
              className="block text-sm font-medium text-[#1C1C1E] mb-1.5"
            >
              Type de bien
            </label>
            <select
              id="type_bien"
              value={typeBien}
              onChange={(e) => setTypeBien(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D1D0CB] bg-white
                         text-sm text-[#1C1C1E]
                         focus:outline-none focus:ring-2 focus:ring-[#7D9B76] focus:border-transparent
                         transition-shadow appearance-none"
            >
              {TYPE_BIEN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.type_bien && (
              <p className="mt-1 text-xs text-[#B91C1C]" role="alert">
                {fieldErrors.type_bien[0]}
              </p>
            )}
          </div>

          {/* Surface */}
          <div>
            <label
              htmlFor="surface"
              className="block text-sm font-medium text-[#1C1C1E] mb-1.5"
            >
              Surface totale (m²)
              <span className="text-[#9B9A94] font-normal ml-1">— optionnel</span>
            </label>
            <input
              id="surface"
              type="number"
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              placeholder="Ex : 85"
              min={1}
              max={10000}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D1D0CB] bg-white
                         text-sm text-[#1C1C1E] placeholder-[#9B9A94]
                         focus:outline-none focus:ring-2 focus:ring-[#7D9B76] focus:border-transparent
                         transition-shadow"
            />
          </div>

          {/* Plan upload */}
          <div>
            <label className="block text-sm font-medium text-[#1C1C1E] mb-1.5">
              Plan du bien
            </label>

            {!planFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed
                           cursor-pointer transition-all duration-200
                           ${isDragOver
                             ? "border-[#7D9B76] bg-[#7D9B76]/5"
                             : "border-[#D1D0CB] bg-white hover:border-[#9B9A94] hover:bg-[#F5F5F0]"
                           }
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]`}
                aria-label="Déposer le plan du bien"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isDragOver ? "#7D9B76" : "#9B9A94"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm font-medium text-[#1C1C1E]">
                  Déposer ou cliquer pour sélectionner
                </span>
                <span className="text-xs text-[#9B9A94]">
                  PDF, PNG, JPG — max {MAX_FILE_SIZE_MB} Mo
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-[#D1D0CB] bg-white">
                {/* Preview */}
                {planPreviewUrl ? (
                  <img
                    src={planPreviewUrl}
                    alt="Aperçu du plan"
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-[#F5F5F0] flex items-center justify-center flex-shrink-0">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9B9A94"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C1C1E] truncate">
                    {planFile.name}
                  </p>
                  <p className="text-xs text-[#9B9A94]">
                    {(planFile.size / (1024 * 1024)).toFixed(1)} Mo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePlan}
                  className="flex-shrink-0 p-3 rounded-md text-[#9B9A94] hover:text-[#B91C1C]
                             hover:bg-[#FEF2F2] transition-colors min-w-[44px] min-h-[44px]
                             flex items-center justify-center
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]"
                  aria-label="Supprimer le plan"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_PLAN_TYPES}
              onChange={handlePlanSelect}
              className="hidden"
              aria-label="Sélectionner le plan du bien"
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg bg-[#FEF2F2] text-sm text-[#B91C1C]"
              role="alert"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {/* Pricing recap + CTA */}
          <div className="border-t border-[#D1D0CB]/40 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-[#9B9A94]">
                  {hasCredits ? "Forfait Pro" : "Accès bêta"}
                </p>
                {hasCredits ? (
                  <p className="text-3xl font-bold text-[#7D9B76] tracking-tight">
                    1 projet
                    <span className="text-sm font-normal text-[#9B9A94] ml-1">inclus dans votre abonnement</span>
                  </p>
                ) : (
                  <p className="text-3xl font-bold text-[#7D9B76] tracking-tight">
                    Gratuit
                    <span className="text-sm font-normal text-[#9B9A94] ml-1">pendant la bêta</span>
                  </p>
                )}
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1C1C1E] text-[#FAFAF8]">
                Dossier PDF inclus
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !adresse.trim() || !planFile}
              className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-white
                         bg-[#7D9B76] hover:bg-[#4A7A42] disabled:bg-[#D1D0CB] disabled:cursor-not-allowed
                         transition-colors focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2
                         shadow-[0_2px_8px_rgba(28,28,30,0.12)]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Création en cours…
                </span>
              ) : sessionStatus !== "authenticated" ? (
                "Se connecter pour continuer"
              ) : (
                "Créer le projet et commencer"
              )}
            </button>

            <p className="text-xs text-[#9B9A94] text-center mt-3">
              Gratuit pendant la bêta — Dossier PDF et visuels IA inclus
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full mt-2 py-2.5 text-sm text-[#9B9A94] hover:text-[#1C1C1E]
                         transition-colors focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded-lg"
            >
              Annuler
            </button>
          </div>
        </form>
      </main>

      <Footer />

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
