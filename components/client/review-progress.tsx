"use client"

import { Check } from "lucide-react"

interface ReviewProgressProps {
  currentStep: number
  totalSteps: number
  completedQuestions: number
  totalQuestions: number
}

export function ReviewProgress({ 
  currentStep, 
  totalSteps,
  completedQuestions,
  totalQuestions
}: ReviewProgressProps) {
  const progress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  step < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : step === currentStep
                    ? "border-primary bg-background text-primary"
                    : "border-muted bg-background text-muted-foreground"
                }`}
              >
                {step < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step}</span>
                )}
              </div>
              <span className="mt-2 text-xs text-muted-foreground">
                Step {step}
              </span>
            </div>
            {step < totalSteps && (
              <div
                className={`mx-2 h-0.5 flex-1 transition-colors ${
                  step < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium text-foreground">
            {completedQuestions} of {totalQuestions} questions answered
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default ReviewProgress
