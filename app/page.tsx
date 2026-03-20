"use client";

import { useState, useCallback } from "react";
import StepIndicator from "@/components/StepIndicator";
import UploadZone from "@/components/UploadZone";
import StylePicker, { StyleOption } from "@/components/StylePicker";
import ImageComparator from "@/components/ImageComparator";

interface GenerationResult {
  originalUrl: string;
  generatedUrl: string;
  model: string;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
      <header className="border-b border-gray-200/60">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              VisiRénov
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Visualisez le potentiel de vos biens en quelques secondes
            </p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6">
            Le home staging virtuel
            <br />
            <span className="text-sage">
              pensé pour les marchands de biens
            </span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto mb-8">
            Transformez vos photos de biens bruts en visuels meublés et décorés
            grâce à l&apos;intelligence artificielle. Constituez vos dossiers de
            précommercialisation et aidez vos acquéreurs à se projeter — en
            quelques secondes.
          </p>
          <a
            href="#outil"
            className="inline-flex items-center gap-2 bg-sage text-white px-8 py-3.5 rounded-lg font-medium hover:bg-sage-dark transition-colors text-base"
          >
            Essayer l&apos;outil
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </a>
        </div>
      </section>

      {/* Tool Section */}
      <section id="outil" className="py-12 px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <StepIndicator currentStep={currentStep} />

          {/* Step 1: Upload */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                1. Uploadez vos photos
              </h3>
            </div>
            <UploadZone files={files} onFilesChange={setFiles} />
          </div>

          {/* Step 2: Style */}
          {files.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  2. Choisissez un style
                </h3>
              </div>
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
            <div className="text-center mb-10">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-3 bg-sage text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-sage-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sage/20 hover:shadow-xl hover:shadow-sage/30"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
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
                    L&apos;IA travaille sur votre bien… (
                    {currentProcessing + 1}/{files.length})
                  </>
                ) : (
                  <>
                    Générer la visualisation
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading state */}
          {isGenerating && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 bg-sage/5 border border-sage/20 rounded-xl px-6 py-4">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-sage rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-sage rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-sage rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <p className="text-sage font-medium">
                  L&apos;IA travaille sur votre bien… Cela peut prendre quelques
                  secondes.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={handleReset}
                className="mt-2 text-sm text-red-500 underline hover:text-red-700"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Step 3: Results */}
          {results.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  3. Résultats
                </h3>
              </div>
              <div className="space-y-8">
                {results.map((result, index) => (
                  <ImageComparator
                    key={index}
                    originalUrl={result.originalUrl}
                    generatedUrl={result.generatedUrl}
                    model={result.model}
                  />
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 border-2 border-sage text-sage px-6 py-3 rounded-lg font-medium hover:bg-sage/5 transition-colors"
                >
                  Relancer avec un autre style
                </button>
                <button
                  onClick={handleFullReset}
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Nouvelle session
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-center px-6 pb-4">
        <p className="text-xs text-gray-400">
          Les visuels générés sont des projections indicatives à des fins de
          précommercialisation.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>Outil réservé aux professionnels de l&apos;immobilier</p>
          <div className="flex items-center gap-4">
            <a
              href="mailto:contact@visirenov.fr"
              className="hover:text-sage transition-colors"
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
