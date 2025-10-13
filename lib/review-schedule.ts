// Shore Agents - Review Scheduling System
// Calculates review due dates based on assignment start dates

import { Review } from "@prisma/client"

export type ReviewType = "MONTH_1" | "MONTH_3" | "MONTH_5" | "RECURRING_6M" | "AD_HOC"

export type ReviewStatus = "NOT_SENT" | "DUE_SOON" | "OVERDUE" | "PENDING" | "COMPLETED"

export interface ReviewMilestone {
  type: ReviewType
  dueDate: Date
  daysUntilDue: number
  isOverdue: boolean
  isSent: boolean
  status: ReviewStatus
}

/**
 * Calculate the next review due date for a staff assignment
 * 
 * Review Schedule:
 * - Month 1: 30 days after start date
 * - Month 3: 90 days after start date
 * - Month 5: 150 days after start date (Regularization)
 * - Recurring 6M: Every 180 days after last review
 * 
 * @param startDate - Assignment start date
 * @param completedReviews - Array of completed reviews for this assignment
 * @returns Next review milestone or null if all reviews up to date
 */
export function getNextReviewDue(
  startDate: Date,
  completedReviews: Review[] = []
): ReviewMilestone | null {
  const now = new Date()
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Check which reviews are completed
  const completedTypes = new Set(completedReviews.map(r => r.type))

  // Month 1 Review (30 days after start)
  if (!completedTypes.has("MONTH_1")) {
    const dueDate = new Date(startDate)
    dueDate.setDate(dueDate.getDate() + 30)
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isOverdue = now > dueDate
    
    return {
      type: "MONTH_1",
      dueDate,
      daysUntilDue,
      isOverdue,
      isSent: false, // Assume not sent unless checked separately
      status: isOverdue ? "OVERDUE" : daysUntilDue <= 7 ? "DUE_SOON" : "NOT_SENT"
    }
  }

  // Month 3 Review (90 days after start)
  // Only consider if we're at least 60 days in
  if (!completedTypes.has("MONTH_3") && daysSinceStart >= 60) {
    const dueDate = new Date(startDate)
    dueDate.setDate(dueDate.getDate() + 90)
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isOverdue = now > dueDate
    
    return {
      type: "MONTH_3",
      dueDate,
      daysUntilDue,
      isOverdue,
      isSent: false,
      status: isOverdue ? "OVERDUE" : daysUntilDue <= 7 ? "DUE_SOON" : "NOT_SENT"
    }
  }

  // Month 5 Review (150 days after start) - REGULARIZATION
  // Only consider if we're at least 120 days in
  if (!completedTypes.has("MONTH_5") && daysSinceStart >= 120) {
    const dueDate = new Date(startDate)
    dueDate.setDate(dueDate.getDate() + 150)
    const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isOverdue = now > dueDate
    
    return {
      type: "MONTH_5",
      dueDate,
      daysUntilDue,
      isOverdue,
      isSent: false,
      status: isOverdue ? "OVERDUE" : daysUntilDue <= 7 ? "DUE_SOON" : "NOT_SENT"
    }
  }

  // 6-Month Recurring (every 180 days after last recurring review)
  // Only start recurring reviews after 150 days (after Month 5)
  if (daysSinceStart >= 150) {
    const recurringReviews = completedReviews
      .filter(r => r.type === "RECURRING_6M")
      .sort((a, b) => b.submittedDate.getTime() - a.submittedDate.getTime())

    // If we have recurring reviews, calculate from the last one
    // Otherwise, calculate from start date + 180 days
    const lastRecurring = recurringReviews[0]
    const baseDate = lastRecurring ? lastRecurring.submittedDate : startDate
    const daysToAdd = lastRecurring ? 180 : 180
    
    const dueDate = new Date(baseDate)
    dueDate.setDate(dueDate.getDate() + daysToAdd)

    // Only return if this review is actually due
    if (now >= new Date(dueDate.getTime() - (7 * 24 * 60 * 60 * 1000))) { // 7 days before
      const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isOverdue = now > dueDate
      
      return {
        type: "RECURRING_6M",
        dueDate,
        daysUntilDue,
        isOverdue,
        isSent: false,
        status: isOverdue ? "OVERDUE" : daysUntilDue <= 7 ? "DUE_SOON" : "NOT_SENT"
      }
    }
  }

  return null // All reviews up to date
}

/**
 * Get complete review schedule for an assignment (all milestones)
 * Useful for preview when creating assignments
 * 
 * @param startDate - Assignment start date
 * @returns Array of all review milestones
 */
export function getReviewSchedule(startDate: Date): ReviewMilestone[] {
  const milestones: ReviewMilestone[] = []
  const now = new Date()

  // Month 1
  const month1 = new Date(startDate)
  month1.setDate(month1.getDate() + 30)
  const daysUntilMonth1 = Math.floor((month1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  milestones.push({
    type: "MONTH_1",
    dueDate: month1,
    daysUntilDue: daysUntilMonth1,
    isOverdue: now > month1,
    isSent: false,
    status: now > month1 ? "OVERDUE" : daysUntilMonth1 <= 7 ? "DUE_SOON" : "NOT_SENT"
  })

  // Month 3
  const month3 = new Date(startDate)
  month3.setDate(month3.getDate() + 90)
  const daysUntilMonth3 = Math.floor((month3.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  milestones.push({
    type: "MONTH_3",
    dueDate: month3,
    daysUntilDue: daysUntilMonth3,
    isOverdue: now > month3,
    isSent: false,
    status: now > month3 ? "OVERDUE" : daysUntilMonth3 <= 7 ? "DUE_SOON" : "NOT_SENT"
  })

  // Month 5 - Regularization
  const month5 = new Date(startDate)
  month5.setDate(month5.getDate() + 150)
  const daysUntilMonth5 = Math.floor((month5.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  milestones.push({
    type: "MONTH_5",
    dueDate: month5,
    daysUntilDue: daysUntilMonth5,
    isOverdue: now > month5,
    isSent: false,
    status: now > month5 ? "OVERDUE" : daysUntilMonth5 <= 7 ? "DUE_SOON" : "NOT_SENT"
  })

  // First 6-month recurring (180 days from start)
  const recurring1 = new Date(startDate)
  recurring1.setDate(recurring1.getDate() + 180)
  const daysUntilRecurring1 = Math.floor((recurring1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  milestones.push({
    type: "RECURRING_6M",
    dueDate: recurring1,
    daysUntilDue: daysUntilRecurring1,
    isOverdue: now > recurring1,
    isSent: false,
    status: now > recurring1 ? "OVERDUE" : daysUntilRecurring1 <= 7 ? "DUE_SOON" : "NOT_SENT"
  })

  return milestones
}

/**
 * Format review type for display
 * 
 * @param type - Review type enum
 * @returns Formatted string
 */
export function formatReviewType(type: string): string {
  const labels: Record<string, string> = {
    MONTH_1: "Month 1 Review",
    MONTH_3: "Month 3 Review",
    MONTH_5: "Month 5 - Regularization",
    RECURRING_6M: "6-Month Check-In",
    AD_HOC: "Ad-Hoc Review"
  }
  return labels[type] || type
}

/**
 * Get status badge variant based on review status
 * 
 * @param status - Review status
 * @returns Tailwind class or variant string
 */
export function getStatusVariant(status: ReviewStatus): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<ReviewStatus, "default" | "secondary" | "destructive" | "outline"> = {
    NOT_SENT: "secondary",
    DUE_SOON: "default",
    OVERDUE: "destructive",
    PENDING: "outline",
    COMPLETED: "default"
  }
  return variants[status] || "default"
}

/**
 * Calculate days employed from start date
 * 
 * @param startDate - Assignment start date
 * @returns Number of days employed
 */
export function calculateDaysEmployed(startDate: Date): number {
  const now = new Date()
  return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Format date for display
 * 
 * @param date - Date to format
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

/**
 * Format relative time (e.g., "3 days ago", "in 5 days")
 * 
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays === -1) return "Yesterday"
  if (diffDays > 0) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

