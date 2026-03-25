"use client";

/**
 * F4.A — Page Compte utilisateur avec section Profil Marchand.
 *
 * - Checkbox "Je suis marchand de biens"
 * - SIRET lookup via Pappers/INSEE
 * - Branding: logo, couleurs, police
 * - Enregistrement profil
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import AuthButton from "@/components/AuthButton";

// ─── Types ───────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lora", label: "Lora" },
  { value: "DM Sans", label: "DM Sans" },
];

// ─── Component ───────────────────────────────────────────────────────

export default function ComptePage() {
  const { data: session, status } = useSession();

  // Profile state
  const [isMerchant, setIsMerchant] = useState(false);
  const [siret, setSiret] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTéléphone] = useState("");
  const [emailPro, setEmailPro] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("");
  const [couleurPrincipale, setCouleurPrincipale] = useState("#1C1C1E");
  const [couleurSecondaire, setCouleurSecondaire] = useState("#7D9B76");
  const [police, setPolice] = useState("Inter");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [, setLogoStorageKey] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [siretError, setSiretError] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState<Array<{
    raisonSociale: string;
    adresse: string;
    formeJuridique: string;
    siret: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Load profile on mount ──
  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadProfile() {
      try {
        const res = await fetch("/api/merchant/profile");
        if (!res.ok) return;
        const { profile } = await res.json();
        if (!profile) return;

        setIsMerchant(profile.is_merchant);
        setSiret(profile.siret || "");
        setRaisonSociale(profile.raison_sociale || "");
        setAdresse(profile.adresse || "");
        setTéléphone(profile.telephone || "");
        setEmailPro(profile.email_pro || "");
        setFormeJuridique(profile.forme_juridique || "");
        setCouleurPrincipale(profile.couleur_principale || "#1C1C1E");
        setCouleurSecondaire(profile.couleur_secondaire || "#7D9B76");
        setPolice(profile.police || "Inter");
        if (profile.logo_storage_key) {
          setLogoStorageKey(profile.logo_storage_key);
          setLogoPreview(`/api/logs/image?path=${encodeURIComponent(profile.logo_storage_key)}`);
        }
      } catch {
        // Silently fail — profile may not exist yet
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [status]);

  // ── SIRET lookup ──
  const handleSiretLookup = useCallback(async () => {
    const cleanSiret = siret.replace(/\s/g, "");
    if (!/^\d{14}$/.test(cleanSiret)) {
      setSiretError("Le SIRET doit contenir exactement 14 chiffres.");
      return;
    }

    setSiretError(null);
    setIsLookingUp(true);

    try {
      const res = await fetch("/api/merchant/lookup-siret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siret: cleanSiret }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSiretError(data.error || "SIRET introuvable.");
        return;
      }

      const data = await res.json();
      if (data.raisonSociale) setRaisonSociale(data.raisonSociale);
      if (data.adresse) setAdresse(data.adresse);
      if (data.formeJuridique) setFormeJuridique(data.formeJuridique);
    } catch {
      setSiretError("Erreur de connexion. Réessayez.");
    } finally {
      setIsLookingUp(false);
    }
  }, [siret]);

  // ── Company name search ──
  const handleCompanySearch = useCallback(async () => {
    const q = companySearch.trim();
    if (q.length < 2) return;

    setIsSearching(true);
    setSiretError(null);

    try {
      const res = await fetch("/api/merchant/lookup-siret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setCompanyResults(data.results);
        setShowResults(true);
      } else {
        setCompanyResults([]);
        setShowResults(true);
        setSiretError(data.error || "Aucune entreprise trouvée.");
      }
    } catch {
      setSiretError("Erreur de connexion. Réessayez.");
    } finally {
      setIsSearching(false);
    }
  }, [companySearch]);

  const selectCompany = useCallback((company: { raisonSociale: string; adresse: string; formeJuridique: string; siret: string }) => {
    setSiret(company.siret);
    setRaisonSociale(company.raisonSociale);
    setAdresse(company.adresse);
    setFormeJuridique(company.formeJuridique);
    setCompanySearch("");
    setShowResults(false);
    setCompanyResults([]);
    setSiretError(null);
  }, []);

  // Close results on outside click
  useEffect(() => {
    if (!showResults) return;
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showResults]);

  // ── Logo upload ──
  const handleLogoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setSaveMessage({ type: "error", text: "Format invalide. Seuls PNG et JPG sont acceptés." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({ type: "error", text: "Le logo ne doit pas dépasser 2 Mo." });
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/merchant/profile", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveMessage({ type: "error", text: data.error || "Erreur lors de l'upload du logo." });
        return;
      }

      const { logoStorageKey: key } = await res.json();
      setLogoStorageKey(key);
      setSaveMessage({ type: "success", text: "Logo enregistré." });
    } catch {
      setSaveMessage({ type: "error", text: "Erreur de connexion." });
    } finally {
      setIsUploadingLogo(false);
    }
  }, []);

  // ── Save profile ──
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/merchant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isMerchant,
          siret: siret.replace(/\s/g, "") || null,
          raisonSociale: raisonSociale || null,
          adresse: adresse || null,
          telephone: telephone || null,
          emailPro: emailPro || null,
          formeJuridique: formeJuridique || null,
          couleurPrincipale,
          couleurSecondaire,
          police,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveMessage({ type: "error", text: data.error || "Erreur lors de la sauvegarde." });
        return;
      }

      setSaveMessage({ type: "success", text: "Profil enregistré." });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: "error", text: "Erreur de connexion." });
    } finally {
      setIsSaving(false);
    }
  }, [isMerchant, siret, raisonSociale, adresse, telephone, emailPro, formeJuridique, couleurPrincipale, couleurSecondaire, police]);

  // ─── Auth guard ──
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--foreground)]/20 border-t-[var(--foreground)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-5">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Mon compte</h1>
          <p className="text-sm text-[var(--muted)] font-light">
            Connectez-vous pour accéder à votre profil marchand.
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--foreground)]/5 bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-[var(--foreground)] tracking-tighter">
            Versiroom
          </a>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)] font-light hidden sm:inline">
              {session.user?.email}
            </span>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight mb-8">
          Mon compte
        </h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--foreground)]/20 border-t-[var(--foreground)] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* ── Merchant toggle ── */}
            <div className="border border-[var(--border)] rounded-2xl p-5" data-testid="merchant-profile-section">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMerchant}
                  onChange={(e) => setIsMerchant(e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--sage)] focus:ring-[var(--sage)]/50 focus:ring-offset-2"
                  data-testid="merchant-toggle"
                />
                <div>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Je suis marchand de biens
                  </span>
                  <p className="text-xs text-[var(--muted)] font-light mt-0.5">
                    Active le branding personnalisé sur vos dossiers et PDF.
                  </p>
                </div>
              </label>
            </div>

            {/* ── Merchant form (visible only when toggled) ── */}
            {isMerchant && (
              <div className="space-y-6 animate-fade-in-up">
                {/* SIRET lookup */}
                <div className="border border-[var(--border)] rounded-2xl p-5 space-y-4">
                  <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest">
                    Entreprise
                  </h2>

                  {/* Company name search */}
                  <div ref={searchRef} className="relative">
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                      Rechercher par nom d&apos;entreprise
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={companySearch}
                        onChange={(e) => {
                          setCompanySearch(e.target.value);
                          setSiretError(null);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCompanySearch(); } }}
                        placeholder="Ex : Dupont Immobilier, SCI Martin..."
                        className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                        data-testid="merchant-company-search"
                      />
                      <button
                        onClick={handleCompanySearch}
                        disabled={isSearching || companySearch.trim().length < 2}
                        className="px-4 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2 whitespace-nowrap"
                      >
                        {isSearching ? (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Search results dropdown */}
                    {showResults && companyResults.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                        {companyResults.map((company, i) => (
                          <button
                            key={`${company.siret}-${i}`}
                            onClick={() => selectCompany(company)}
                            className="w-full text-left px-4 py-3 hover:bg-[var(--foreground)]/[0.03] transition-colors border-b border-[var(--border)] last:border-b-0"
                          >
                            <p className="text-sm font-medium text-[var(--foreground)]">{company.raisonSociale}</p>
                            <p className="text-xs text-[var(--muted)] font-light mt-0.5">
                              {company.siret && <span className="font-mono">{company.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4")}</span>}
                              {company.adresse && <span> &middot; {company.adresse}</span>}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {showResults && companyResults.length === 0 && !isSearching && (
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-lg p-4 text-center">
                        <p className="text-sm text-[var(--muted)] font-light">Aucune entreprise trouvée</p>
                        <p className="text-xs text-[var(--muted)]/60 font-light mt-1">Essayez un autre nom ou entrez le SIRET ci-dessous</p>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-xs text-[var(--muted)]/60 font-light">ou par SIRET</span>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                  </div>

                  {/* SIRET direct lookup */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                        SIRET
                      </label>
                      <input
                        type="text"
                        value={siret}
                        onChange={(e) => {
                          setSiret(e.target.value);
                          setSiretError(null);
                        }}
                        placeholder="123 456 789 01234"
                        maxLength={17}
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                        data-testid="merchant-siret-input"
                      />
                      {siretError && (
                        <p className="text-xs text-red-500 font-light mt-1">{siretError}</p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleSiretLookup}
                        disabled={isLookingUp || siret.replace(/\s/g, "").length < 14}
                        className="px-4 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2 whitespace-nowrap"
                        data-testid="merchant-siret-lookup"
                      >
                        {isLookingUp ? "Recherche..." : "Rechercher"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                        Raison sociale
                      </label>
                      <input
                        type="text"
                        value={raisonSociale}
                        onChange={(e) => setRaisonSociale(e.target.value)}
                        placeholder="SCI Dupont Immobilier"
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                        data-testid="merchant-raison-sociale"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                        Forme juridique
                      </label>
                      <input
                        type="text"
                        value={formeJuridique}
                        onChange={(e) => setFormeJuridique(e.target.value)}
                        placeholder="SCI"
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                        data-testid="merchant-forme-juridique"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                      Adresse professionnelle
                    </label>
                    <input
                      type="text"
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                      placeholder="12 rue du Commerce, 33000 Bordeaux"
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                      data-testid="merchant-adresse"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={telephone}
                        onChange={(e) => setTéléphone(e.target.value)}
                        placeholder="06 12 34 56 78"
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                        data-testid="merchant-telephone"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                        Email professionnel
                      </label>
                      <input
                        type="email"
                        value={emailPro}
                        onChange={(e) => setEmailPro(e.target.value)}
                        placeholder="contact@dupont-immo.fr"
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                        data-testid="merchant-email-pro"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Branding ── */}
                <div className="border border-[var(--border)] rounded-2xl p-5 space-y-4">
                  <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest">
                    Identité visuelle
                  </h2>

                  {/* Logo */}
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
                      Logo
                    </label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="w-16 h-16 rounded-xl border border-[var(--border)] overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoPreview}
                            alt="Logo"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-[var(--muted)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="text-sm font-medium text-[var(--sage)] hover:text-[var(--sage)]/80 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2 rounded"
                          data-testid="merchant-logo-upload"
                        >
                          {isUploadingLogo ? "Upload en cours..." : logoPreview ? "Changer le logo" : "Ajouter un logo"}
                        </button>
                        <p className="text-[10px] text-[var(--muted)]/50 font-light mt-0.5">
                          PNG ou JPG, max 2 Mo
                        </p>
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleLogoChange}
                        className="hidden"
                        data-testid="merchant-logo-input"
                      />
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                        Couleur principale
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={couleurPrincipale}
                          onChange={(e) => setCouleurPrincipale(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-[var(--border)] cursor-pointer p-0.5"
                          data-testid="merchant-couleur-principale"
                        />
                        <input
                          type="text"
                          value={couleurPrincipale}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                              setCouleurPrincipale(e.target.value);
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-[var(--border)] rounded-xl text-sm font-mono font-light focus:border-[var(--foreground)] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                        Couleur secondaire
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={couleurSecondaire}
                          onChange={(e) => setCouleurSecondaire(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-[var(--border)] cursor-pointer p-0.5"
                          data-testid="merchant-couleur-secondaire"
                        />
                        <input
                          type="text"
                          value={couleurSecondaire}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                              setCouleurSecondaire(e.target.value);
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-[var(--border)] rounded-xl text-sm font-mono font-light focus:border-[var(--foreground)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Font */}
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                      Police
                    </label>
                    <select
                      value={police}
                      onChange={(e) => setPolice(e.target.value)}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50"
                      data-testid="merchant-police"
                    >
                      {FONT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preview swatch */}
                  <div className="p-4 rounded-xl border border-[var(--border)]">
                    <p className="text-xs text-[var(--muted)] font-light mb-2">Aperçu</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: couleurPrincipale }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: couleurSecondaire }}
                      />
                      <span
                        className="text-sm font-medium ml-2"
                        style={{ color: couleurPrincipale, fontFamily: police }}
                      >
                        {raisonSociale || "Votre raison sociale"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Save button ── */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-3 bg-[var(--sage)] text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2"
                    data-testid="merchant-save-profile"
                  >
                    {isSaving ? "Enregistrement..." : "Enregistrer le profil"}
                  </button>

                  {saveMessage && (
                    <span
                      className={`text-sm font-light animate-fade-in-up ${
                        saveMessage.type === "success" ? "text-[var(--sage)]" : "text-red-500"
                      }`}
                    >
                      {saveMessage.text}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
