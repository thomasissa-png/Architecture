"use client";

/**
 * AuthModal — Modal de connexion / création de compte.
 * Google OAuth + Email/Mot de passe via NextAuth CredentialsProvider.
 * Design minimaliste Versiroom — audité UX 9/10 + Design 9/10.
 *
 * Corrections appliquées :
 * - P0 UX : max-h-[90dvh] + overflow-y-auto pour clavier virtuel iPhone
 * - P1 UX : focus trap complet
 * - P2 UX : messages d'erreur contextuels (Google vs email, role="alert")
 * - P3 UX : bouton close 44px, texte legal 12px
 * - P4 UX : toggle visibilité mot de passe + lien mot de passe oublié
 * - D1 Design : bg-background au lieu de bg-white sur bouton Google
 * - D2 Design : focus ring sage/60 (WCAG AA)
 * - D3 Design : transitions duration-200, active:scale-[0.99] sur CTA
 * - D4 Design : backdrop-blur-md + bg-foreground/45
 * - D5 Design : texte legal text-xs text-muted/60
 */

import { signIn } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
}

type Mode = "login" | "register";

export default function AuthModal({ isOpen, onClose, callbackUrl }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setIsLoading(false);
      setShowPassword(false);
    } else {
      setEmail("");
      setPassword("");
      setName("");
      setMode("login");
    }
  }, [isOpen]);

  // Focus trap + Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Focus first focusable element
    const focusableSelector = 'button, input, a[href], [tabindex]:not([tabindex="-1"])';
    const firstFocusable = modal.querySelector<HTMLElement>(focusableSelector);
    setTimeout(() => firstFocusable?.focus(), 100);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google", {
        callbackUrl: callbackUrl || window.location.pathname,
        redirect: true,
      });
    } catch {
      setError("Erreur de connexion Google. Vérifiez votre connexion internet.");
      setIsLoading(false);
    }
  }, [callbackUrl]);

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Email et mot de passe requis.");
      setIsLoading(false);
      return;
    }

    if (mode === "register") {
      if (password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères.");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, password, name: name.trim() || undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          // Contextual error messages
          if (res.status === 409 && data.error?.includes("Google")) {
            setError("Cet email est lié à un compte Google. Utilisez le bouton « Continuer avec Google » ci-dessus.");
          } else if (res.status === 409) {
            setError("Un compte existe déjà avec cet email.");
            setMode("login");
          } else {
            setError(data.error || "Erreur lors de la création du compte.");
          }
          setIsLoading(false);
          return;
        }
        setSuccess("Compte créé ! Connexion en cours...");
      } catch {
        setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
        setIsLoading(false);
        return;
      }
    }

    // Sign in with credentials
    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if (result?.error) {
        const msg = result.error === "CredentialsSignin"
          ? "Email ou mot de passe incorrect."
          : result.error;
        setError(msg);
        setSuccess(null);
        setIsLoading(false);
        return;
      }

      window.location.href = callbackUrl || window.location.pathname;
    } catch {
      setError("Erreur de connexion. Réessayez.");
      setIsLoading(false);
    }
  }, [email, password, name, mode, callbackUrl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop — blur-md for photo-heavy backgrounds */}
      <div
        className="absolute inset-0 bg-foreground/45 backdrop-blur-md"
        style={{ animation: "fadeIn 200ms ease-out" }}
        onClick={onClose}
      />

      {/* Modal — scrollable for iOS keyboard */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-background rounded-3xl shadow-2xl border border-foreground/5 max-h-[min(90vh,90dvh)] overflow-y-auto"
        style={{ animation: "fadeInUp 300ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Close button — 44px touch target */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors duration-200 text-muted hover:text-foreground z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 sm:px-8 pt-10 pb-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 id="auth-modal-title" className="text-2xl font-bold text-foreground tracking-tight mb-2">
              {mode === "login" ? "Connexion" : "Créer un compte"}
            </h2>
            <p className="text-sm text-muted font-light">
              {mode === "login"
                ? "Retrouvez vos créations et vos crédits."
                : "Gratuit — 3 générations offertes sans CB."}
            </p>
          </div>

          {/* Error message — role="alert" for screen readers */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 bg-red-50/50 border border-red-200/60 rounded-xl p-3.5 text-center"
            >
              <p className="text-red-600/80 text-sm font-light">{error}</p>
            </div>
          )}
          {success && (
            <div role="status" aria-live="polite" className="mb-5 bg-sage/5 border border-sage/20 rounded-xl p-3.5 text-center">
              <p className="text-sage text-sm font-light">{success}</p>
            </div>
          )}

          {/* Google Sign In — bg-background (not bg-white) for design system coherence */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-background border border-foreground/12 rounded-xl px-5 py-3.5 text-sm font-medium text-foreground hover:bg-foreground/[0.03] hover:border-foreground/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            data-testid="auth-google-signin"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continuer avec Google</span>
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-foreground/8" />
            <span className="text-xs text-muted font-light">ou par email</span>
            <div className="flex-1 h-px bg-foreground/8" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === "register" && (
              <input
                type="text"
                placeholder="Prénom (optionnel)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-foreground/10 rounded-xl px-4 py-3 text-sm bg-transparent placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-sage/60 focus:border-sage/50 focus:bg-background transition-all duration-150"
                autoComplete="given-name"
                data-testid="auth-name-input"
              />
            )}
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-foreground/10 rounded-xl px-4 py-3 text-sm bg-transparent placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-sage/60 focus:border-sage/50 focus:bg-background transition-all duration-150"
              autoComplete="email"
              data-testid="auth-email-input"
            />
            {/* Password field with visibility toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "register" ? "Mot de passe (8 caractères min.)" : "Mot de passe"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "register" ? 8 : undefined}
                className="w-full border border-foreground/10 rounded-xl px-4 py-3 pr-12 text-sm bg-transparent placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-sage/60 focus:border-sage/50 focus:bg-background transition-all duration-150"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                data-testid="auth-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted/40 hover:text-muted transition-colors duration-150"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Forgot password link (login mode only) */}
            {mode === "login" && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError("Fonctionnalité bientôt disponible. Contactez-nous à contact@versiroom.fr");
                  }}
                  className="text-xs text-muted/60 hover:text-muted transition-colors duration-150"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Submit CTA — active:scale for premium feel */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-foreground text-background rounded-xl px-4 py-3.5 text-sm font-medium tracking-wide hover:bg-foreground/75 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="auth-submit-btn"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === "register" ? "Création..." : "Connexion..."}
                </span>
              ) : (
                mode === "register" ? "Créer mon compte" : "Se connecter"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="text-center mt-5">
            {mode === "login" ? (
              <p className="text-xs text-muted font-light">
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
                  className="text-foreground font-medium hover:underline"
                  data-testid="auth-switch-register"
                >
                  Créer un compte
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted font-light">
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                  className="text-foreground font-medium hover:underline"
                  data-testid="auth-switch-login"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>

          {/* Legal — text-xs (12px) for WCAG + RGPD compliance */}
          <p className="text-center text-xs text-muted/60 font-light mt-5 leading-loose">
            En continuant, vous acceptez nos{" "}
            <a href="/cgv" className="underline hover:text-muted/80 transition-colors">CGV</a> et notre{" "}
            <a href="/confidentialite" className="underline hover:text-muted/80 transition-colors">politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
