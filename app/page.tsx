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

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const heroRef = useReveal();
  const toolRef = useReveal();

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
          throw new Error(data.error || "Erreur lors de la génération");
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
          err instanceof Error ? err.message : "Erreur lors de la génération"
        );
        break;
      }
    }
    setIsGenerating(false);
  }, [files, selectedStyle, customPrompt]);

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

  const canGenerate =
    files.length > 0 && (selectedStyle !== null || customPrompt.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-gray-200/40">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground tracking-tighter">
            VisiRénov
          </h1>
          <span className="text-xs text-muted font-light tracking-wide uppercase">
            Home staging IA
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-32 px-8">
        <div ref={heroRef} className="reveal max-w-4xl mx-auto text-center">
          <p className="text-sm text-sage font-medium tracking-widest uppercase mb-6">
            Pour les marchands de biens
          </p>
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tighter mb-8">
            Visualisez le potentiel
            <br />
            <span className="font-light text-muted">de vos biens</span>
          </h2>
          <p className="text-lg text-muted font-light leading-relaxed max-w-xl mx-auto mb-12">
            Transformez vos photos de biens bruts en visuels meublés
            grâce à l&apos;IA. Précommercialisez plus vite.
          </p>

          {/* Hero mock — before/after visual */}
          <div className="max-w-3xl mx-auto mb-14">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl hero-mock-gradient flex items-center justify-center overflow-hidden">
                  <div className="text-center">
                    <svg className="w-10 h-10 text-gray-400/60 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <span className="text-sm text-gray-400/80 font-light">Bien brut</span>
                  </div>
                </div>
                <span className="absolute bottom-3 left-3 text-[10px] font-medium text-gray-400 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  AVANT
                </span>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl hero-mock-gradient-after flex items-center justify-center overflow-hidden">
                  <div className="text-center">
                    <svg className="w-10 h-10 text-sage/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                    <span className="text-sm text-sage/60 font-light">Meublé par l&apos;IA</span>
                  </div>
                </div>
                <span className="absolute bottom-3 left-3 text-[10px] font-medium text-sage bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  APRES
                </span>
              </div>
            </div>
          </div>

          <a
            href="#outil"
            className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-foreground/85 transition-all text-sm tracking-wide"
          >
            Essayer l&apos;outil
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-gray-200/60" />

      {/* Tool Section */}
      <section id="outil" className="pt-28 pb-32 px-8">
        <div ref={toolRef} className="reveal max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Transformez vos photos
            </h3>
            <p className="text-muted font-light">
              En trois étapes simples
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
            <div className="mb-16 animate-fade-in-up">
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
            <div className="text-center mb-16 animate-fade-in-up">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 rounded-full font-medium text-base hover:bg-foreground/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Génération en cours… ({currentProcessing + 1}/{files.length})
                  </>
                ) : (
                  <>
                    Générer la visualisation
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
                <p className="text-sm text-muted font-light">
                  L&apos;IA analyse et meuble votre bien…
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-12 bg-red-50/50 border border-red-200/60 rounded-2xl p-6 text-center">
              <p className="text-red-600/80 text-sm">{error}</p>
              <button
                onClick={handleReset}
                className="mt-3 text-xs text-red-400 underline underline-offset-4 hover:text-red-600 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Step 3: Results */}
          {results.length > 0 && (
            <div className="animate-fade-in-up">
              <h4 className="text-sm font-medium text-muted uppercase tracking-widest mb-6">
                03 — Résultat
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-12">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors"
                >
                  Relancer avec un autre style
                </button>
                <button
                  onClick={handleFullReset}
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 text-muted px-7 py-3.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Nouvelle session
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-center px-8 pb-6">
        <p className="text-[11px] text-muted/50 font-light">
          Les visuels générés sont des projections indicatives à des fins de
          précommercialisation.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/40 py-10 px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted/60 font-light">
          <p>Outil réservé aux professionnels de l&apos;immobilier</p>
          <div className="flex items-center gap-6">
            <a
              href="mailto:contact@visirenov.fr"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <span>&copy; VisiRénov 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
