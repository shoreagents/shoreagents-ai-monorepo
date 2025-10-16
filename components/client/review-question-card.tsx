"use client"
// Updated: 2025-10-16 - Force rebuild

import { Star } from "lucide-react"
import { ReviewQuestion } from "@/lib/review-templates"

interface ReviewQuestionCardProps {
  question: ReviewQuestion
  value: number | null
  onChange: (questionId: string, value: number) => void
}

function ReviewQuestionCard({ question, value, onChange }: ReviewQuestionCardProps) {
  console.log('ReviewQuestionCard props:', { question, value, onChange: typeof onChange })
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4">
        <p className="text-base font-medium text-foreground">
          {question.question}
          {question.required && <span className="ml-1 text-red-500">*</span>}
        </p>
      </div>

      {/* 5-Star Rating */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(question.id, rating)}
            className="group relative transition-transform hover:scale-110"
          >
            <Star
              className={`h-10 w-10 transition-colors ${
                value && rating <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300 hover:text-amber-300"
              }`}
            />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100">
              {rating}
            </span>
          </button>
        ))}
        {value && (
          <span className="ml-4 text-sm font-medium text-foreground">
            {value === 1 && "Poor"}
            {value === 2 && "Below Expectations"}
            {value === 3 && "Meets Expectations"}
            {value === 4 && "Exceeds Expectations"}
            {value === 5 && "Outstanding"}
          </span>
        )}
      </div>
    </div>
  )
}

export default ReviewQuestionCard
