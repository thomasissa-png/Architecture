"use client";

/**
 * ProStepper — Stepper 7 étapes pour le parcours marchand.
 *
 * Rendu : Client Component (états visuels interactifs).
 *
 * Props :
 * - currentStep : étape active (1-7)
 * - completedSteps : étapes terminées (ex: [1, 2, 3])
 * - errorSteps? : étapes en erreur (ex: [2])
 *
 * Design tokens issus de docs/marchand-pivot/design/page-compositions.md :
 * - Completed : #7D9B76 (sage) + check blanc
 * - Active : #1C1C1E (foreground)
 * - Locked : #D1D0CB
 * - Error : #EF4444
 * - Connecteur done : #7D9B76, pending : #D1D0CB
 */

const STEPS = [
  { label: "Projet", sublabel: "Upload" },
  { label: "Analyse", sublabel: "Détection des pièces" },
  { label: "Validation", sublabel: "Pièces" },
  { label: "Qualification", sublabel: "Cible" },
  { label: "Recommandations", sublabel: "Architecte" },
  { label: "Visuels", sublabel: "Génération" },
  { label: "Dossier", sublabel: "PDF" },
] as const;

interface ProStepperProps {
  currentStep: number;
  completedSteps: number[];
  errorSteps?: number[];
}

type StepState = "completed" | "active" | "locked" | "error";

function getStepState(
  stepIndex: number,
  currentStep: number,
  completedSteps: number[],
  errorSteps: number[]
): StepState {
  const stepNumber = stepIndex + 1;
  if (errorSteps.includes(stepNumber)) return "error";
  if (completedSteps.includes(stepNumber)) return "completed";
  if (stepNumber === currentStep) return "active";
  return "locked";
}

/** Check icon SVG for completed steps. */
function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Dot colors and styles per state. */
const DOT_STYLES: Record<StepState, string> = {
  completed: "bg-[#7D9B76] text-white",
  active: "bg-[#1C1C1E] text-white ring-4 ring-[#1C1C1E]/10",
  locked: "bg-[#D1D0CB] text-[#9B9A94]",
  error: "bg-[#EF4444] text-white",
};

const LABEL_STYLES: Record<StepState, string> = {
  completed: "text-[#4A7A42] font-medium",
  active: "text-[#1C1C1E] font-semibold",
  locked: "text-[#9B9A94] font-normal",
  error: "text-[#B91C1C] font-medium",
};

export default function ProStepper({
  currentStep,
  completedSteps,
  errorSteps = [],
}: ProStepperProps) {
  return (
    <nav
      aria-label="Progression du projet"
      className="w-full overflow-x-auto"
    >
      {/* Desktop : horizontal */}
      <ol className="hidden sm:flex items-start justify-between gap-0">
        {STEPS.map((step, i) => {
          const state = getStepState(i, currentStep, completedSteps, errorSteps);
          const isLast = i === STEPS.length - 1;

          return (
            <li
              key={step.label}
              className="flex items-center flex-1 last:flex-none"
              aria-current={state === "active" ? "step" : undefined}
            >
              <div className="flex flex-col items-center min-w-[60px]">
                {/* Dot */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs transition-all duration-300 ${DOT_STYLES[state]}`}
                >
                  {state === "completed" ? (
                    <CheckIcon />
                  ) : state === "error" ? (
                    <span aria-hidden="true">!</span>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={`mt-2 text-xs tracking-[0.02em] leading-4 text-center ${LABEL_STYLES[state]}`}
                >
                  {step.label}
                </span>
                <span className="text-[11px] text-[#9B9A94] leading-[14px] text-center">
                  {step.sublabel}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-4 self-start transition-colors duration-300 ${
                    completedSteps.includes(i + 1)
                      ? "bg-[#7D9B76]"
                      : "bg-[#D1D0CB]"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile : vertical compact */}
      <ol className="flex sm:hidden flex-col gap-1.5 px-1">
        {STEPS.map((step, i) => {
          const state = getStepState(i, currentStep, completedSteps, errorSteps);
          const isLast = i === STEPS.length - 1;

          return (
            <li
              key={step.label}
              className="flex items-start gap-2.5"
              aria-current={state === "active" ? "step" : undefined}
            >
              <div className="flex flex-col items-center">
                {/* Dot — w-6 h-6 au lieu de w-8 h-8 sur mobile */}
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] transition-all duration-300 ${DOT_STYLES[state]}`}
                >
                  {state === "completed" ? (
                    <CheckIcon />
                  ) : state === "error" ? (
                    <span aria-hidden="true">!</span>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                {/* Vertical connector — réduit */}
                {!isLast && (
                  <div
                    className={`w-0.5 h-3 mt-0.5 transition-colors duration-300 ${
                      completedSteps.includes(i + 1)
                        ? "bg-[#7D9B76]"
                        : "bg-[#D1D0CB]"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
              {/* Label uniquement — sublabels masqués sur mobile */}
              <div className="pt-0.5">
                <span
                  className={`text-xs tracking-[0.02em] leading-4 ${LABEL_STYLES[state]}`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
