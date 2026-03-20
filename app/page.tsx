"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import StepIndicator from "@/components/StepIndicator";
import UploadZone from "@/components/UploadZone";
import StylePicker, { StyleOption } from "@/components/StylePicker";
import ImageComparator from "@/components/ImageComparator";

interface GenerationResult {
  originalUrl: string;
  generatedUrl: string;
  model: string;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function scrollToElement(id: string) {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
}

const USE_CASES = [
  { label: "Architectes", desc: "Partagez des pistes d\u2019inspiration" },
  { label: "Marchands de biens", desc: "Pr\u00e9commercialisez vos op\u00e9rations" },
  { label: "Particuliers", desc: "D\u00e9corez votre futur chez-vous" },
];

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generationElapsed, setGenerationElapsed] = useState(0);

  const heroRef = useReveal();
  const toolRef = useReveal();
  const pricingRef = useReveal();

  // Timer for generation elapsed time
  useEffect(() => {
    if (!isGenerating) {
      setGenerationElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setGenerationElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const currentStep =
    results.length > 0
      ? 3
      : selectedStyle || customPrompt
      ? 2
      : files.length > 0
      ? 2
      : 1;

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) return;
    const stylePrompt = selectedStyle?.prompt || customPrompt;
    if (!stylePrompt) return;

    setIsGenerating(true);
    setError(null);
    setResults([]);

    for (let i = 0; i < files.length; i++) {
      setCurrentProcessing(i);
      try {
        const base64 = await fileToBase64(files[i]);
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, stylePrompt }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur lors de la g\u00e9n\u00e9ration");
        }

        const data = await response.json();
        setResults((prev) => [
          ...prev,
          {
            originalUrl: URL.createObjectURL(files[i]),
            generatedUrl: data.image,
            model: data.model,
          },
        ]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors de la g\u00e9n\u00e9ration"
        );
        break;
      }
    }
    setIsGenerating(false);
    scrollToElement("step-results");
  }, [files, selectedStyle, customPrompt]);

  const handleRetry = useCallback(() => {
    setResults([]);
    setError(null);
    setTimeout(() => {
      handleGenerate();
    }, 100);
  }, [handleGenerate]);

  const handleReset = () => {
    setResults([]);
    setError(null);
  };

  const handleFullReset = () => {
    setFiles([]);
    setSelectedStyle(null);
    setCustomPrompt("");
    setResults([]);
    setError(null);
  };

  const handleDownloadAll = () => {
    results.forEach((result, index) => {
      const link = document.createElement("a");
      link.href = result.generatedUrl;
      link.download = `visirenov-${index + 1}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Auto-scroll to style step when files are added
  const prevFilesLength = useRef(0);
  useEffect(() => {
    if (files.length > 0 && prevFilesLength.current === 0) {
      scrollToElement("step-style");
    }
    prevFilesLength.current = files.length;
  }, [files.length]);

  const canGenerate =
    files.length > 0 && (selectedStyle !== null || customPrompt.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-gray-200/40">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground tracking-tighter">
            VisiR&eacute;nov
          </h1>
          <nav className="flex items-center gap-6">
            <a href="#pricing" className="text-xs text-muted font-light hover:text-foreground transition-colors hidden sm:block">
              Tarifs
            </a>
            <a
              href="#outil"
              className="text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Essayer
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-8">
        <div ref={heroRef} className="reveal max-w-4xl mx-auto text-center">
          {/* Multi-audience pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {USE_CASES.map((uc) => (
              <span
                key={uc.label}
                className="text-[11px] font-medium text-sage bg-sage/10 px-3 py-1.5 rounded-full"
              >
                {uc.label}
              </span>
            ))}
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tighter mb-6">
            Visualisez vos espaces
            <br />
            <span className="font-light text-muted">meubl&eacute;s par l&apos;IA</span>
          </h2>
          <p className="text-lg text-muted font-light leading-relaxed max-w-2xl mx-auto mb-8">
            Uploadez une photo de pi&egrave;ce vide, choisissez un style parmi 12 ambiances, et recevez un visuel meubl&eacute; en quelques secondes. Pour les pros comme pour les particuliers.
          </p>

          {/* Hero before/after — richly illustrated mock */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden hero-before-scene">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Architectural room outline */}
                    <svg className="w-24 h-24 sm:w-32 sm:h-32 text-gray-400/50" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth={0.8}>
                      {/* Floor */}
                      <line x1="10" y1="80" x2="110" y2="80" />
                      {/* Back wall */}
                      <rect x="15" y="20" width="90" height="60" rx="1" strokeDasharray="3 3" />
                      {/* Window */}
                      <rect x="40" y="28" width="40" height="30" rx="1" />
                      <line x1="60" y1="28" x2="60" y2="58" />
                      <line x1="40" y1="43" x2="80" y2="43" />
                    </svg>
                    <span className="text-xs text-gray-400/70 font-light mt-2">Pi&egrave;ce vide</span>
                  </div>
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-medium text-gray-400 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  AVANT
                </span>
              </div>
              <div className="relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden hero-after-scene">
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Furnished room illustration */}
                    <svg className="w-24 h-24 sm:w-32 sm:h-32 text-sage/50" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth={0.8}>
                      {/* Floor */}
                      <line x1="10" y1="80" x2="110" y2="80" />
                      {/* Back wall */}
                      <rect x="15" y="20" width="90" height="60" rx="1" />
                      {/* Window */}
                      <rect x="40" y="28" width="40" height="30" rx="1" />
                      <line x1="60" y1="28" x2="60" y2="58" />
                      {/* Sofa */}
                      <rect x="22" y="62" width="36" height="12" rx="3" fill="currentColor" fillOpacity="0.15" />
                      <rect x="22" y="56" width="36" height="8" rx="2" fill="currentColor" fillOpacity="0.1" />
                      {/* Coffee table */}
                      <rect x="62" y="68" width="16" height="8" rx="1" fill="currentColor" fillOpacity="0.12" />
                      {/* Plant */}
                      <circle cx="90" cy="62" r="6" fill="currentColor" fillOpacity="0.15" />
                      <line x1="90" y1="68" x2="90" y2="76" />
                      {/* Lamp */}
                      <line x1="25" y1="40" x2="25" y2="56" />
                      <path d="M20 40 L30 40 L27 35 L23 35 Z" fill="currentColor" fillOpacity="0.1" />
                      {/* Rug */}
                      <ellipse cx="55" cy="78" rx="25" ry="4" fill="currentColor" fillOpacity="0.08" />
                    </svg>
                    <span className="text-xs text-sage/60 font-light mt-2">Meubl&eacute; par l&apos;IA</span>
                  </div>
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-[10px] font-medium text-sage bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  APR&Egrave;S
                </span>
              </div>
            </div>
          </div>

          {/* Social proof line */}
          <p className="text-xs text-muted/50 font-light mb-6">
            12 styles disponibles &middot; R&eacute;sultat en 10-30 secondes &middot; T&eacute;l&eacute;chargement HD gratuit
          </p>

          <a
            href="#outil"
            className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-foreground/85 transition-all text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            Essayer gratuitement
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Use cases */}
      <section className="pb-16 px-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {USE_CASES.map((uc, i) => (
            <div key={uc.label} className={`text-center p-6 rounded-2xl border border-gray-200/60 bg-white/40 ${i === 0 ? "animate-fade-in-up" : i === 1 ? "animate-fade-in-up animate-delay-100" : "animate-fade-in-up animate-delay-200"}`}>
              <p className="text-sm font-semibold text-foreground mb-1">{uc.label}</p>
              <p className="text-xs text-muted font-light">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-gray-200/60" />

      {/* Tool Section */}
      <section id="outil" className="pt-24 pb-32 px-8">
        <div ref={toolRef} className="reveal max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Transformez vos photos
            </h3>
            <p className="text-muted font-light">
              En trois &eacute;tapes simples
            </p>
          </div>

          <StepIndicator currentStep={currentStep} />

          {/* Step 1: Upload */}
          <div className="mb-16">
            <h4 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
              01 — Upload
            </h4>
            <UploadZone files={files} onFilesChange={setFiles} />
          </div>

          {/* Step 2: Style */}
          {files.length > 0 && (
            <div id="step-style" className="mb-16 animate-fade-in-up scroll-mt-28">
              <h4 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
                02 — Style
              </h4>
              <StylePicker
                selectedStyle={selectedStyle}
                customPrompt={customPrompt}
                onStyleSelect={setSelectedStyle}
                onCustomPromptChange={setCustomPrompt}
              />
            </div>
          )}

          {/* Generate Button */}
          {canGenerate && results.length === 0 && (
            <div id="step-generate" className="text-center mb-16 animate-fade-in-up">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 rounded-full font-medium text-base hover:bg-foreground/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    G&eacute;n&eacute;ration en cours&hellip; ({currentProcessing + 1}/{files.length})
                  </>
                ) : (
                  <>
                    G&eacute;n&eacute;rer la visualisation
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading state */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-4 bg-background border border-gray-200/80 rounded-2xl px-8 py-5 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <div>
                  <p className="text-sm text-muted font-light">
                    L&apos;IA analyse et meuble votre bien&hellip;
                  </p>
                  <p className="text-[10px] text-muted/50 font-light mt-1">
                    {generationElapsed < 10
                      ? `${generationElapsed}s — Estimation : 10-30 secondes`
                      : `${generationElapsed}s — Presque termin\u00e9\u2026`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-12 bg-red-50/50 border border-red-200/60 rounded-2xl p-6 text-center">
              <p className="text-red-600/80 text-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-3 text-xs text-red-400 underline underline-offset-4 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
              >
                R&eacute;essayer
              </button>
            </div>
          )}

          {/* Step 3: Results */}
          {results.length > 0 && (
            <div id="step-results" className="animate-fade-in-up scroll-mt-28">
              <h4 className="text-sm font-medium text-muted uppercase tracking-widest mb-6">
                03 — R&eacute;sultat
              </h4>
              <div className="space-y-10">
                {results.map((result, index) => (
                  <ImageComparator
                    key={index}
                    originalUrl={result.originalUrl}
                    generatedUrl={result.generatedUrl}
                    model={result.model}
                  />
                ))}
              </div>

              {/* Batch download */}
              {results.length > 1 && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleDownloadAll}
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors underline underline-offset-4 font-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    Tout t&eacute;l&eacute;charger ({results.length} images)
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                >
                  Relancer avec un autre style
                </button>
                <button
                  onClick={handleFullReset}
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 text-muted px-7 py-3.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                >
                  Nouvelle session
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-8 bg-white/40">
        <div ref={pricingRef} className="reveal max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Tarifs simples et transparents
            </h3>
            <p className="text-muted font-light">
              Commencez gratuitement, &eacute;voluez selon vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* Free */}
            <div className="border border-gray-200 rounded-2xl p-6 text-center bg-background">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-3">D&eacute;couverte</p>
              <p className="text-3xl font-bold text-foreground mb-1">Gratuit</p>
              <p className="text-xs text-muted font-light mb-6">Pour tester l&apos;outil</p>
              <ul className="text-sm text-muted font-light space-y-2.5 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  3 g&eacute;n&eacute;rations / jour
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  12 styles disponibles
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  T&eacute;l&eacute;chargement HD
                </li>
              </ul>
              <a href="#outil" className="block w-full text-center border border-gray-300 text-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                Commencer
              </a>
            </div>

            {/* Pro */}
            <div className="border-2 border-foreground rounded-2xl p-6 text-center bg-background relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-medium px-3 py-1 rounded-full uppercase tracking-wider">Populaire</span>
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-3">Pro</p>
              <p className="text-3xl font-bold text-foreground mb-1">29&euro;<span className="text-base font-light text-muted">/mois</span></p>
              <p className="text-xs text-muted font-light mb-6">Pour les professionnels</p>
              <ul className="text-sm text-muted font-light space-y-2.5 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  50 g&eacute;n&eacute;rations / mois
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Style personnalis&eacute; illimit&eacute;
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  R&eacute;solution maximale
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Priorit&eacute; de traitement
                </li>
              </ul>
              <button className="w-full bg-foreground text-background px-4 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2">
                Bient&ocirc;t disponible
              </button>
            </div>

            {/* Business */}
            <div className="border border-gray-200 rounded-2xl p-6 text-center bg-background">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-3">Business</p>
              <p className="text-3xl font-bold text-foreground mb-1">79&euro;<span className="text-base font-light text-muted">/mois</span></p>
              <p className="text-xs text-muted font-light mb-6">Pour les agences &amp; MDB</p>
              <ul className="text-sm text-muted font-light space-y-2.5 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  G&eacute;n&eacute;rations illimit&eacute;es
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  API &amp; int&eacute;grations
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Marque blanche
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Support d&eacute;di&eacute;
                </li>
              </ul>
              <a href="mailto:contact@visirenov.fr" className="block w-full text-center border border-gray-300 text-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-center px-8 pb-6 pt-8">
        <p className="text-[11px] text-muted/50 font-light">
          Les visuels g&eacute;n&eacute;r&eacute;s sont des projections indicatives &agrave; des fins d&apos;inspiration et de pr&eacute;commercialisation.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/40 py-10 px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted/60 font-light">
          <p>Pour les architectes, marchands de biens et particuliers</p>
          <div className="flex items-center gap-6">
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Tarifs
            </a>
            <a
              href="mailto:contact@visirenov.fr"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <span>&copy; VisiR&eacute;nov 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
