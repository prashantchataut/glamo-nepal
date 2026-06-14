"use client";

import { CheckCircle2 } from "lucide-react";

const steps = [
  { label: "Address", icon: "MapPin" },
  { label: "Delivery", icon: "Truck" },
  { label: "Payment", icon: "CreditCard" },
  { label: "Review", icon: "ClipboardCheck" },
] as const;

interface CheckoutStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (step: number) => void;
}

export function CheckoutStepper({ currentStep, completedSteps, onStepClick }: CheckoutStepperProps) {
  return (
    <nav aria-label="Checkout progress">
      <ol role="list" className="mb-6 flex items-center gap-0 md:mb-8">
        {steps.map((step, i) => {
          const isActive = currentStep === i;
          const isCompleted = completedSteps.has(i);
          const canNavigate = isCompleted || i === currentStep || (i > 0 && completedSteps.has(i - 1));

          return (
            <li key={step.label} className="flex items-center">
              <button
                type="button"
                onClick={() => canNavigate && onStepClick(i)}
                disabled={!canNavigate}
                className={`flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${canNavigate ? "cursor-pointer" : "cursor-not-allowed"}`}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.label}${isCompleted ? " (completed)" : isActive ? " (current)" : ""}`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition md:h-10 md:w-10 ${
                    isActive
                      ? "bg-neutral-950 text-white"
                      : isCompleted
                        ? "bg-primary text-white"
                        : "bg-white text-neutral-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={17} /> : <StepIcon step={step.label} size={17} />}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.08em] md:text-xs md:tracking-[0.12em] ${
                    isActive || isCompleted ? "text-neutral-950" : "text-neutral-500"
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`mx-2 hidden h-px flex-1 md:block ${isCompleted ? "bg-primary" : "bg-neutral-200"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepIcon({ step, size }: { step: string; size: number }) {
  switch (step) {
    case "Address":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "Delivery":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.39-2.726A1 1 0 0 0 18.61 10H14" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </svg>
      );
    case "Payment":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      );
    case "Review":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="2" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}