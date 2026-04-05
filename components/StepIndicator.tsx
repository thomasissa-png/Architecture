"use client";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Upload" },
  { number: 2, label: "Espace" },
  { number: 3, label: "Style" },
  { number: 4, label: "Résultat" },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 mb-14">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-500 ${
                currentStep >= step.number
                  ? "bg-foreground text-background"
                  : "bg-gray-100 text-gray-300"
              }`}
            >
              {currentStep > step.number ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-xs font-medium transition-colors duration-500 tracking-wide hidden sm:inline ${
                currentStep >= step.number ? "text-foreground" : "text-gray-300"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-px mx-2 sm:mx-4 transition-colors duration-500 ${
                currentStep > step.number ? "bg-foreground" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
