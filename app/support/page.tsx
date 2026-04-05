"use client";

/**
 * /support — Page de contact support Versimo.
 * Rendu client : formulaire interactif avec session NextAuth.
 * Protégée : redirect vers /login si non connecté.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const CATEGORIES = [
  "Problème de génération",
  "Facturation/crédits",
  "Suggestion",
  "Question",
  "Autre question",
] as const;

type Category = (typeof CATEGORIES)[number];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state
  const [category, setCategory] = useState<Category | "">("");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);

  // UI state
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    category?: string;
    message?: string;
    screenshot?: string;
  }>({});

  const fileRef = useRef<HTMLInputElement>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 5000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  // Redirect if not authenticated
  if (status === "loading") {
    return (
      <>
        <Header variant="internal" />
        <main className="min-h-screen bg-background pt-24 px-4">
          <div className="max-w-xl mx-auto animate-pulse">
            <div className="h-8 w-48 bg-foreground/5 rounded-lg mb-8" />
            <div className="space-y-4">
              <div className="h-12 bg-foreground/5 rounded-xl" />
              <div className="h-12 bg-foreground/5 rounded-xl" />
              <div className="h-32 bg-foreground/5 rounded-xl" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!session) {
    router.replace("/login?callbackUrl=/support");
    return null;
  }

  const userEmail = session.user?.email || "";

  // ─── Handlers ────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFieldErrors((prev) => ({ ...prev, screenshot: undefined }));

    if (!file) {
      setScreenshot(null);
      setScreenshotName(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        screenshot: "Format non supporté (JPG ou PNG uniquement)",
      }));
      setScreenshot(null);
      setScreenshotName(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFieldErrors((prev) => ({
        ...prev,
        screenshot: "Fichier trop lourd (max 5 Mo)",
      }));
      setScreenshot(null);
      setScreenshotName(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot(reader.result as string);
      setScreenshotName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function removeScreenshot() {
    setScreenshot(null);
    setScreenshotName(null);
    setFieldErrors((prev) => ({ ...prev, screenshot: undefined }));
    if (fileRef.current) fileRef.current.value = "";
  }

  function validate(): boolean {
    const errors: typeof fieldErrors = {};

    if (!category) {
      errors.category = "Sélectionnez une catégorie";
    }

    if (message.trim().length < 10) {
      errors.message = "Message trop court (10 caractères minimum)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!validate()) return;

    setSending(true);
    setToast(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          screenshot: screenshot || undefined,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const ticketId = data.ticketId
          ? String(data.ticketId).padStart(5, "0")
          : String(Date.now()).slice(-5);
        setToast({
          type: "success",
          text: `Demande #${ticketId} envoyée, nous vous répondons sous 24h.`,
        });
        // Reset form (keep email)
        setCategory("");
        setMessage("");
        removeScreenshot();
        setFieldErrors({});
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({
          type: "error",
          text: data.error || "Erreur d'envoi, réessayez.",
        });
      }
    } catch {
      setToast({
        type: "error",
        text: "Erreur d'envoi, réessayez.",
      });
    } finally {
      setSending(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <>
      <Header variant="internal" />
      <main className="min-h-screen bg-background pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-2 tracking-tight">
            Contactez-nous
          </h1>
          <p className="text-sm text-muted font-light mb-8">
            Une question, un bug, une suggestion ? Nous vous répondons sous 24h.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email (readonly) */}
            <div>
              <label
                htmlFor="support-email"
                className="block text-xs text-muted font-light mb-1.5"
              >
                Adresse email
              </label>
              <input
                id="support-email"
                type="email"
                value={userEmail}
                readOnly
                className="w-full px-4 py-3 bg-foreground/[0.03] border border-foreground/10 rounded-xl text-sm text-foreground/50 font-light cursor-not-allowed"
                tabIndex={-1}
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="support-category"
                className="block text-xs text-muted font-light mb-1.5"
              >
                Catégorie
              </label>
              <select
                id="support-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as Category);
                  setFieldErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className={`w-full px-4 py-3 bg-background border rounded-xl text-sm font-light appearance-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                  fieldErrors.category
                    ? "border-red-400/60"
                    : "border-foreground/10 hover:border-foreground/20"
                } ${category === "" ? "text-muted" : "text-foreground"}`}
                aria-describedby={
                  fieldErrors.category ? "category-error" : undefined
                }
              >
                <option value="" disabled>
                  Sélectionnez une catégorie
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {fieldErrors.category && (
                <p
                  id="category-error"
                  className="text-xs text-red-500/80 font-light mt-1"
                >
                  {fieldErrors.category}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="support-message"
                className="block text-xs text-muted font-light mb-1.5"
              >
                Message
              </label>
              <textarea
                id="support-message"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, message: undefined }));
                }}
                rows={5}
                placeholder="Décrivez votre demande en quelques lignes..."
                className={`w-full px-4 py-3 bg-background border rounded-xl text-sm text-foreground font-light resize-y min-h-[120px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 placeholder:text-muted/50 ${
                  fieldErrors.message
                    ? "border-red-400/60"
                    : "border-foreground/10 hover:border-foreground/20"
                }`}
                maxLength={2000}
                aria-describedby={
                  fieldErrors.message ? "message-error" : "message-hint"
                }
              />
              {fieldErrors.message ? (
                <p
                  id="message-error"
                  className="text-xs text-red-500/80 font-light mt-1"
                >
                  {fieldErrors.message}
                </p>
              ) : (
                <p
                  id="message-hint"
                  className="text-xs text-muted/50 font-light mt-1"
                >
                  {message.length}/2000
                </p>
              )}
            </div>

            {/* Screenshot */}
            <div>
              <label className="block text-xs text-muted font-light mb-1.5">
                Ajouter une capture (optionnel)
              </label>
              {screenshot && screenshotName ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-foreground/[0.03] border border-foreground/10 rounded-xl">
                  <svg
                    className="w-4 h-4 text-sage flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                    />
                  </svg>
                  <span className="text-sm text-foreground font-light truncate flex-1">
                    {screenshotName}
                  </span>
                  <button
                    type="button"
                    onClick={removeScreenshot}
                    className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-foreground/5 text-muted hover:text-foreground transition-colors flex-shrink-0"
                    aria-label="Supprimer la capture"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="support-screenshot"
                  className={`flex items-center gap-3 px-4 py-3 min-h-[56px] border border-dashed rounded-xl cursor-pointer transition-colors hover:border-sage/40 hover:bg-sage/[0.03] ${
                    fieldErrors.screenshot
                      ? "border-red-400/60"
                      : "border-foreground/15"
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <span className="text-sm text-muted font-light">
                    JPG ou PNG, max 5 Mo
                  </span>
                  <input
                    id="support-screenshot"
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
              {fieldErrors.screenshot && (
                <p className="text-xs text-red-500/80 font-light mt-1">
                  {fieldErrors.screenshot}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto px-8 py-3 bg-sage text-white text-sm font-medium rounded-xl hover:bg-sage/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 min-h-[44px]"
            >
              {sending ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
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
                  Envoi en cours…
                </span>
              ) : (
                "Envoyer"
              )}
            </button>
          </form>

          {/* Toast */}
          {toast && (
            <div
              className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-light animate-fade-in-up ${
                toast.type === "success"
                  ? "bg-sage/95 text-white"
                  : "bg-red-500/90 text-white"
              }`}
              role="status"
              aria-live="polite"
            >
              {toast.type === "success" && (
                <span className="mr-2">&#10003;</span>
              )}
              {toast.text}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
