// Shore Agents Review System - Complete Question Templates

export type ReviewType = "month_1" | "month_3" | "month_5" | "recurring_6m" | "ad_hoc"

export interface ReviewQuestion {
  id: string
  section: string
  sectionEmoji: string
  question: string
  type: "rating" | "text" | "select" | "checkbox"
  description?: string
  contextNote?: string // "For permanence:" type notes
  options?: { value: number | string; label: string }[]
  required: boolean
  showNA?: boolean
  hasTrend?: boolean // For 6-month reviews
}

export interface ReviewAnswer {
  questionId: string
  value: number | string | string[]
  trend?: "better" | "same" | "worse" // For 6-month reviews
}

export interface Review {
  id: number
  type: ReviewType
  staffMember: string
  client: string
  reviewer: string
  reviewerTitle?: string
  submittedDate: string
  evaluationPeriod: string
  status: "pending" | "acknowledged" | "archived"
  answers: Record<string, ReviewAnswer>
  overallScore: number
  acknowledgedDate?: string
  previousScore?: number // For recurring reviews
}

// 🔵 MONTH 1: Comprehensive Onboarding Assessment (18 questions)
export const MONTH_1_QUESTIONS: ReviewQuestion[] = [
  // SECTION 1: RELIABILITY & AVAILABILITY
  {
    id: "m1_reliability",
    section: "Reliability & Availability",
    sectionEmoji: "📊",
    question: "How reliable has this team member been with their schedule?",
    description: "Showing up when expected, available during agreed hours",
    type: "rating",
    options: [
      { value: 5, label: "Always available, perfectly reliable" },
      { value: 4, label: "Very reliable, rare exceptions" },
      { value: 3, label: "Generally reliable, occasional issues" },
      { value: 2, label: "Frequently unreliable" },
      { value: 1, label: "Major reliability problems" },
    ],
    required: true,
  },
  {
    id: "m1_responsiveness",
    section: "Reliability & Availability",
    sectionEmoji: "📊",
    question: "How responsive are they to your messages and requests?",
    description: "Email, Slack, phone - do they reply promptly?",
    type: "rating",
    options: [
      { value: 5, label: "Extremely responsive, replies immediately" },
      { value: 4, label: "Very responsive, replies within expected timeframe" },
      { value: 3, label: "Adequate response time, sometimes slow" },
      { value: 2, label: "Often slow to respond" },
      { value: 1, label: "Very unresponsive, hard to reach" },
    ],
    required: true,
  },

  // SECTION 2: COMMUNICATION QUALITY
  {
    id: "m1_written_english",
    section: "Communication Quality",
    sectionEmoji: "💬",
    question: "How would you rate their written English communication?",
    description: "Emails, messages, documentation - grammar, clarity, professionalism",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - native level, no issues" },
      { value: 4, label: "Very good - professional and clear" },
      { value: 3, label: "Good - generally clear, minor issues" },
      { value: 2, label: "Fair - frequent errors or unclear" },
      { value: 1, label: "Poor - difficult to understand" },
    ],
    required: true,
  },
  {
    id: "m1_spoken_english",
    section: "Communication Quality",
    sectionEmoji: "💬",
    question: "How would you rate their spoken English communication?",
    description: "Phone calls, video meetings - clarity, accent, fluency",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - perfectly clear, easy to understand" },
      { value: 4, label: "Very good - clear with minimal accent" },
      { value: 3, label: "Good - understandable, some accent" },
      { value: 2, label: "Fair - requires repetition often" },
      { value: 1, label: "Poor - difficult to understand" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m1_understanding",
    section: "Communication Quality",
    sectionEmoji: "💬",
    question: "How well do they understand your instructions and requirements?",
    description: "Do they 'get it' the first time or need lots of clarification?",
    type: "rating",
    options: [
      { value: 5, label: "Understands immediately, rarely needs clarification" },
      { value: 4, label: "Usually understands, minimal clarification needed" },
      { value: 3, label: "Sometimes needs clarification" },
      { value: 2, label: "Frequently misunderstands" },
      { value: 1, label: "Consistently struggles to understand" },
    ],
    required: true,
  },

  // SECTION 3: WORK QUALITY & PERFORMANCE
  {
    id: "m1_work_quality",
    section: "Work Quality & Performance",
    sectionEmoji: "✨",
    question: "How would you rate the quality of their work?",
    description: "Accuracy, attention to detail, meeting your standards",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - exceeds expectations, very few errors" },
      { value: 4, label: "Very good - meets expectations, minor errors" },
      { value: 3, label: "Good - acceptable quality, some errors" },
      { value: 2, label: "Fair - below expectations, frequent errors" },
      { value: 1, label: "Poor - unacceptable quality" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m1_productivity",
    section: "Work Quality & Performance",
    sectionEmoji: "✨",
    question: "How productive are they?",
    description: "Volume of work completed, efficiency",
    type: "rating",
    options: [
      { value: 5, label: "Very productive - completes more than expected" },
      { value: 4, label: "Productive - meets expectations" },
      { value: 3, label: "Adequate - completing assigned work" },
      { value: 2, label: "Below expectations - slow output" },
      { value: 1, label: "Very unproductive" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m1_deadlines",
    section: "Work Quality & Performance",
    sectionEmoji: "✨",
    question: "Do they complete tasks on time?",
    description: "Meeting deadlines and turnaround expectations",
    type: "rating",
    options: [
      { value: 5, label: "Always on time or early" },
      { value: 4, label: "Usually on time" },
      { value: 3, label: "Sometimes needs extensions" },
      { value: 2, label: "Frequently late" },
      { value: 1, label: "Rarely meets deadlines" },
    ],
    required: true,
    showNA: true,
  },

  // SECTION 4: PROFESSIONAL QUALITIES
  {
    id: "m1_initiative",
    section: "Professional Qualities",
    sectionEmoji: "🎯",
    question: "How proactive and self-sufficient are they?",
    description: "Do they take initiative or wait to be told everything?",
    type: "rating",
    options: [
      { value: 5, label: "Very proactive - anticipates needs, takes initiative" },
      { value: 4, label: "Proactive - shows initiative regularly" },
      { value: 3, label: "Adequate - does what's asked" },
      { value: 2, label: "Reactive - needs constant direction" },
      { value: 1, label: "Passive - no initiative" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m1_feedback_response",
    section: "Professional Qualities",
    sectionEmoji: "🎯",
    question: "How well do they handle feedback or corrections?",
    description: "Professional response when you point out issues",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - welcomes feedback, implements immediately" },
      { value: 4, label: "Very good - accepts feedback professionally" },
      { value: 3, label: "Good - generally receptive" },
      { value: 2, label: "Fair - sometimes defensive" },
      { value: 1, label: "Poor - defensive or resistant" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m1_professionalism",
    section: "Professional Qualities",
    sectionEmoji: "🎯",
    question: "How professional are they in interactions with you and your team?",
    description: "Demeanor, communication style, representing your business",
    type: "rating",
    options: [
      { value: 5, label: "Extremely professional at all times" },
      { value: 4, label: "Very professional" },
      { value: 3, label: "Generally professional, minor lapses" },
      { value: 2, label: "Occasionally unprofessional" },
      { value: 1, label: "Unprofessional behavior concerns" },
    ],
    required: true,
  },

  // SECTION 5: OVERALL ASSESSMENT
  {
    id: "m1_expectations",
    section: "Overall Assessment",
    sectionEmoji: "📈",
    question: "Compared to your expectations for someone in their first month, how are they performing?",
    type: "rating",
    options: [
      { value: 5, label: "Far exceeding expectations" },
      { value: 4, label: "Exceeding expectations" },
      { value: 3, label: "Meeting expectations" },
      { value: 2, label: "Below expectations" },
      { value: 1, label: "Far below expectations" },
    ],
    required: true,
  },
  {
    id: "m1_strengths",
    section: "Overall Assessment",
    sectionEmoji: "📈",
    question: "What are they doing really well?",
    description: "What are you most happy with? (2-3 specific things)",
    type: "text",
    required: true,
  },
  {
    id: "m1_improvements",
    section: "Overall Assessment",
    sectionEmoji: "📈",
    question: "What areas need improvement?",
    description: "Where would you like to see them develop? (2-3 specific things)",
    type: "text",
    required: true,
  },
  {
    id: "m1_training_needs",
    section: "Overall Assessment",
    sectionEmoji: "📈",
    question: "Is there any specific training or support we should provide to help them serve you better?",
    type: "text",
    required: false,
  },
  {
    id: "m1_satisfaction",
    section: "Overall Assessment",
    sectionEmoji: "📈",
    question: "Overall, how satisfied are you with this team member so far?",
    type: "rating",
    options: [
      { value: 5, label: "Very satisfied - great fit" },
      { value: 4, label: "Satisfied - working well" },
      { value: 3, label: "Neutral - acceptable but room for improvement" },
      { value: 2, label: "Dissatisfied - significant concerns" },
      { value: 1, label: "Very dissatisfied - not working out" },
    ],
    required: true,
  },
  {
    id: "m1_likelihood_continue",
    section: "Overall Assessment",
    sectionEmoji: "📈",
    question: "Based on this first month, how likely are you to continue working with this team member?",
    type: "rating",
    options: [
      { value: 5, label: "Definitely want to continue" },
      { value: 4, label: "Likely to continue" },
      { value: 3, label: "Unsure / depends on improvement" },
      { value: 2, label: "Unlikely to continue" },
      { value: 1, label: "Want to make a change" },
    ],
    required: true,
  },
  {
    id: "m1_additional_comments",
    section: "Overall Assessment",
    sectionEmoji: "📈",
    question: "Any additional comments or feedback for Shore Agents?",
    type: "text",
    required: false,
  },
]

// 🟢 MONTH 3: Performance Check-In & Improvement Tracking (26 questions)
export const MONTH_3_QUESTIONS: ReviewQuestion[] = [
  // SECTION 1: RELIABILITY & CONSISTENCY
  {
    id: "m3_reliability",
    section: "Reliability & Consistency",
    sectionEmoji: "📊",
    question: "How reliable has this team member been over the past 3 months?",
    description: "Consistent attendance, availability, schedule adherence",
    type: "rating",
    options: [
      { value: 5, label: "Completely reliable, zero issues" },
      { value: 4, label: "Very reliable, rare exceptions" },
      { value: 3, label: "Generally reliable with occasional issues" },
      { value: 2, label: "Frequent reliability problems" },
      { value: 1, label: "Unreliable, ongoing issues" },
    ],
    required: true,
  },
  {
    id: "m3_responsiveness",
    section: "Reliability & Consistency",
    sectionEmoji: "📊",
    question: "How responsive are they to your messages and requests?",
    description: "Response time, communication availability",
    type: "rating",
    options: [
      { value: 5, label: "Extremely responsive, immediate replies" },
      { value: 4, label: "Very responsive, timely replies" },
      { value: 3, label: "Adequate response time" },
      { value: 2, label: "Often slow to respond" },
      { value: 1, label: "Unresponsive, hard to reach" },
    ],
    required: true,
  },
  {
    id: "m3_consistency",
    section: "Reliability & Consistency",
    sectionEmoji: "📊",
    question: "How consistent is their performance week-to-week?",
    description: "Steady output or up-and-down quality?",
    type: "rating",
    options: [
      { value: 5, label: "Very consistent, reliable quality every week" },
      { value: 4, label: "Mostly consistent, minor fluctuations" },
      { value: 3, label: "Somewhat inconsistent" },
      { value: 2, label: "Very inconsistent performance" },
      { value: 1, label: "Unpredictable, unreliable" },
    ],
    required: true,
  },

  // SECTION 2: COMMUNICATION QUALITY
  {
    id: "m3_written_communication",
    section: "Communication Quality",
    sectionEmoji: "💬",
    question: "How would you rate their written English communication?",
    description: "Emails, messages, documentation - has it improved since Month 1?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - native level, professional" },
      { value: 4, label: "Very good - clear and professional" },
      { value: 3, label: "Good - acceptable with minor issues" },
      { value: 2, label: "Fair - frequent errors" },
      { value: 1, label: "Poor - communication problems" },
    ],
    required: true,
  },
  {
    id: "m3_spoken_communication",
    section: "Communication Quality",
    sectionEmoji: "💬",
    question: "How would you rate their spoken English communication?",
    description: "Phone calls, video meetings - clarity and confidence",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - perfectly clear" },
      { value: 4, label: "Very good - clear communication" },
      { value: 3, label: "Good - understandable" },
      { value: 2, label: "Fair - struggles with clarity" },
      { value: 1, label: "Poor - difficult to understand" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m3_proactive_communication",
    section: "Communication Quality",
    sectionEmoji: "💬",
    question: "How well do they communicate proactively?",
    description: "Do they keep you informed, flag issues early, provide updates?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - keeps me informed without prompting" },
      { value: 4, label: "Very good - usually communicates proactively" },
      { value: 3, label: "Adequate - communicates when asked" },
      { value: 2, label: "Poor - have to chase them for updates" },
      { value: 1, label: "Very poor - doesn't communicate proactively" },
    ],
    required: true,
  },

  // SECTION 3: WORK QUALITY & INDEPENDENCE
  {
    id: "m3_work_quality",
    section: "Work Quality & Independence",
    sectionEmoji: "✨",
    question: "How would you rate the quality of their work?",
    description: "Accuracy, attention to detail, meeting standards",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - consistently exceeds standards" },
      { value: 4, label: "Very good - consistently meets standards" },
      { value: 3, label: "Good - acceptable quality, some errors" },
      { value: 2, label: "Fair - below standards, frequent errors" },
      { value: 1, label: "Poor - unacceptable quality" },
    ],
    required: true,
  },
  {
    id: "m3_quality_improvement",
    section: "Work Quality & Independence",
    sectionEmoji: "✨",
    question: "Has the quality improved since Month 1?",
    description: "Are they learning from feedback and getting better?",
    type: "rating",
    options: [
      { value: 5, label: "Significant improvement, learning fast" },
      { value: 4, label: "Noticeable improvement" },
      { value: 3, label: "Some improvement" },
      { value: 2, label: "Little to no improvement" },
      { value: 1, label: "Quality has declined" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m3_productivity",
    section: "Work Quality & Independence",
    sectionEmoji: "✨",
    question: "How productive are they?",
    description: "Volume of work, efficiency, output",
    type: "rating",
    options: [
      { value: 5, label: "Very productive - exceeds expectations" },
      { value: 4, label: "Productive - meets expectations" },
      { value: 3, label: "Adequate productivity" },
      { value: 2, label: "Below expectations" },
      { value: 1, label: "Very unproductive" },
    ],
    required: true,
  },
  {
    id: "m3_independence",
    section: "Work Quality & Independence",
    sectionEmoji: "✨",
    question: "How independently can they work now?",
    description: "Do they still need lots of hand-holding or working autonomously?",
    type: "rating",
    options: [
      { value: 5, label: "Fully independent - minimal supervision needed" },
      { value: 4, label: "Mostly independent - occasional guidance needed" },
      { value: 3, label: "Somewhat independent - regular supervision needed" },
      { value: 2, label: "Still requires significant hand-holding" },
      { value: 1, label: "Cannot work independently" },
    ],
    required: true,
  },
  {
    id: "m3_deadlines",
    section: "Work Quality & Independence",
    sectionEmoji: "✨",
    question: "Do they meet deadlines and commitments?",
    description: "Delivering on time consistently",
    type: "rating",
    options: [
      { value: 5, label: "Always on time or early" },
      { value: 4, label: "Usually on time" },
      { value: 3, label: "Sometimes late" },
      { value: 2, label: "Frequently late" },
      { value: 1, label: "Rarely meets deadlines" },
    ],
    required: true,
  },

  // SECTION 4: PROBLEM-SOLVING & INITIATIVE
  {
    id: "m3_problem_solving",
    section: "Problem-Solving & Initiative",
    sectionEmoji: "🎯",
    question: "How well do they handle problems or unexpected issues?",
    description: "Can they troubleshoot or do they panic/freeze?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent problem solver - resolves independently" },
      { value: 4, label: "Good - usually figures it out" },
      { value: 3, label: "Adequate - needs some guidance" },
      { value: 2, label: "Struggles - needs significant help" },
      { value: 1, label: "Cannot handle problems" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m3_proactivity",
    section: "Problem-Solving & Initiative",
    sectionEmoji: "🎯",
    question: "How proactive are they?",
    description: "Taking initiative, anticipating needs, suggesting improvements",
    type: "rating",
    options: [
      { value: 5, label: "Very proactive - constantly bringing ideas and solutions" },
      { value: 4, label: "Proactive - regularly takes initiative" },
      { value: 3, label: "Adequate - does what's asked" },
      { value: 2, label: "Reactive - only does what's explicitly told" },
      { value: 1, label: "Passive - no initiative whatsoever" },
    ],
    required: true,
  },
  {
    id: "m3_critical_thinking",
    section: "Problem-Solving & Initiative",
    sectionEmoji: "🎯",
    question: "Do they ask smart questions or figure things out?",
    description: "Critical thinking and resourcefulness",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - researches first, asks insightful questions" },
      { value: 4, label: "Good - appropriate questions when needed" },
      { value: 3, label: "Adequate - asks basic questions" },
      { value: 2, label: "Poor - asks too many obvious questions OR never asks" },
      { value: 1, label: "Very poor - constantly needs hand-holding" },
    ],
    required: true,
  },

  // SECTION 5: PROFESSIONAL GROWTH
  {
    id: "m3_feedback_implementation",
    section: "Professional Growth",
    sectionEmoji: "🤝",
    question: "How well do they implement feedback?",
    description: "When you correct or coach them, do they improve?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - implements immediately, learns quickly" },
      { value: 4, label: "Good - usually implements feedback" },
      { value: 3, label: "Adequate - sometimes implements" },
      { value: 2, label: "Poor - rarely implements feedback" },
      { value: 1, label: "Very poor - resistant or doesn't change" },
    ],
    required: true,
  },
  {
    id: "m3_professionalism",
    section: "Professional Growth",
    sectionEmoji: "🤝",
    question: "How professional are they?",
    description: "Demeanor, communication, representing your business",
    type: "rating",
    options: [
      { value: 5, label: "Extremely professional at all times" },
      { value: 4, label: "Very professional" },
      { value: 3, label: "Generally professional" },
      { value: 2, label: "Occasionally unprofessional" },
      { value: 1, label: "Unprofessional behavior" },
    ],
    required: true,
  },
  {
    id: "m3_business_understanding",
    section: "Professional Growth",
    sectionEmoji: "🤝",
    question: "How well do they understand your business and requirements?",
    description: "Do they 'get' what you need or still learning the basics?",
    type: "rating",
    options: [
      { value: 5, label: "Deep understanding - anticipates needs" },
      { value: 4, label: "Good understanding - rarely needs explanation" },
      { value: 3, label: "Basic understanding - sometimes needs clarification" },
      { value: 2, label: "Limited understanding - frequent clarification needed" },
      { value: 1, label: "Poor understanding - doesn't grasp requirements" },
    ],
    required: true,
  },

  // SECTION 6: VALUE & SATISFACTION
  {
    id: "m3_business_value",
    section: "Value & Satisfaction",
    sectionEmoji: "📈",
    question: "How much value are they providing to your business?",
    description: "ROI, contribution, impact",
    type: "rating",
    options: [
      { value: 5, label: "Exceptional value - couldn't imagine without them" },
      { value: 4, label: "Strong value - definitely worth it" },
      { value: 3, label: "Fair value - meeting basic expectations" },
      { value: 2, label: "Limited value - not meeting expectations" },
      { value: 1, label: "Little to no value - not working out" },
    ],
    required: true,
  },
  {
    id: "m3_improvement_since_m1",
    section: "Value & Satisfaction",
    sectionEmoji: "📈",
    question: "Compared to Month 1, how much have they improved?",
    type: "rating",
    options: [
      { value: 5, label: "Dramatically improved - night and day difference" },
      { value: 4, label: "Significantly improved" },
      { value: 3, label: "Moderately improved" },
      { value: 2, label: "Slightly improved" },
      { value: 1, label: "No improvement or declined" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m3_satisfaction",
    section: "Value & Satisfaction",
    sectionEmoji: "📈",
    question: "Overall, how satisfied are you with this team member at Month 3?",
    type: "rating",
    options: [
      { value: 5, label: "Very satisfied - exceeding expectations" },
      { value: 4, label: "Satisfied - meeting expectations" },
      { value: 3, label: "Neutral - acceptable but could improve" },
      { value: 2, label: "Dissatisfied - not meeting expectations" },
      { value: 1, label: "Very dissatisfied - significant concerns" },
    ],
    required: true,
  },
  {
    id: "m3_continue_past_probation",
    section: "Value & Satisfaction",
    sectionEmoji: "📈",
    question: "Based on their performance so far, do you want them to continue past probation?",
    description: "Critical question for regularization decision",
    type: "rating",
    options: [
      { value: 5, label: "Absolutely - want to keep them long-term" },
      { value: 4, label: "Yes - working out well" },
      { value: 3, label: "Conditional - need to see improvement in specific areas (specify below)" },
      { value: 2, label: "Unsure - significant concerns" },
      { value: 1, label: "No - not working out, prefer to make a change" },
    ],
    required: true,
  },

  // SECTION 7: DETAILED FEEDBACK
  {
    id: "m3_strengths",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "What are their greatest strengths?",
    description: "What are they doing exceptionally well? (2-3 specific things)",
    type: "text",
    required: true,
  },
  {
    id: "m3_improvements",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "What areas still need improvement?",
    description: "Where do they need to develop before Month 5? (2-3 specific things)",
    type: "text",
    required: true,
  },
  {
    id: "m3_conditional_improvements",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "If you selected 'Conditional' or lower in previous question, what specific improvements do you need to see by Month 5?",
    description: "Be specific - what must change for you to recommend regularization?",
    type: "text",
    required: false,
  },
  {
    id: "m3_training_support",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "Is there any additional training or support Shore Agents should provide?",
    type: "text",
    required: false,
  },
  {
    id: "m3_additional_comments",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "Any other comments or feedback?",
    type: "text",
    required: false,
  },
]

// 🟣 MONTH 5: REGULARIZATION DECISION - THE BIG ONE (27 questions)
export const MONTH_5_QUESTIONS: ReviewQuestion[] = [
  // THE BIG QUESTION FIRST
  {
    id: "m5_regularization_decision",
    section: "⭐ Regularization Decision",
    sectionEmoji: "⭐",
    question: "Should we regularize this team member for permanent employment with your company?",
    description: "IMPORTANT: This determines whether this team member becomes permanent",
    type: "select",
    options: [
      { value: "yes_regularize", label: "✅ YES - REGULARIZE - I want them as a permanent team member" },
      { value: "yes_conditional", label: "⚠️ YES - WITH CONDITIONS - Regularize, but specific improvements needed" },
      { value: "unsure_extend", label: "🤔 UNSURE - EXTEND PROBATION - Need more time to decide (30-60 days)" },
      { value: "no_change", label: "❌ NO - DO NOT REGULARIZE - Not the right fit, prefer to make a change" },
    ],
    required: true,
  },

  // SECTION 1: LONG-TERM RELIABILITY
  {
    id: "m5_reliability_longterm",
    section: "Long-Term Reliability",
    sectionEmoji: "📊",
    question: "Over 5 months, how reliable has this team member been?",
    description: "Attendance, punctuality, availability, consistency",
    contextNote: "Critical for long-term: Can you count on them day in, day out for years?",
    type: "rating",
    options: [
      { value: 5, label: "Completely reliable - no concerns whatsoever" },
      { value: 4, label: "Very reliable - rare issues, always communicated" },
      { value: 3, label: "Generally reliable - some issues but manageable" },
      { value: 2, label: "Reliability concerns - frequent issues" },
      { value: 1, label: "Unreliable - ongoing problems" },
    ],
    required: true,
  },
  {
    id: "m5_performance_consistency",
    section: "Long-Term Reliability",
    sectionEmoji: "📊",
    question: "How consistent is their performance?",
    description: "Week-to-week, month-to-month reliability of quality and output",
    contextNote: "For permanence: You need consistency you can bank on",
    type: "rating",
    options: [
      { value: 5, label: "Rock solid - consistently excellent" },
      { value: 4, label: "Very consistent - predictably good" },
      { value: 3, label: "Somewhat inconsistent - ups and downs" },
      { value: 2, label: "Very inconsistent - can't predict performance" },
      { value: 1, label: "Unreliable performance" },
    ],
    required: true,
  },

  // SECTION 2: COMMUNICATION MATURITY
  {
    id: "m5_written_communication_now",
    section: "Communication Maturity",
    sectionEmoji: "💬",
    question: "How would you rate their written communication NOW?",
    description: "After 5 months of experience with your business",
    contextNote: "For permanence: Can they communicate with YOUR clients without supervision?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - represents your brand perfectly" },
      { value: 4, label: "Very good - professional and clear" },
      { value: 3, label: "Good - acceptable, minor improvements needed" },
      { value: 2, label: "Fair - still needs work" },
      { value: 1, label: "Poor - communication issues remain" },
    ],
    required: true,
  },
  {
    id: "m5_spoken_communication_now",
    section: "Communication Maturity",
    sectionEmoji: "💬",
    question: "How would you rate their spoken communication NOW?",
    description: "If applicable - phone, video, meetings",
    contextNote: "For permanence: Professional, clear, and confident?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - sounds professional, clear, confident" },
      { value: 4, label: "Very good - clear and effective" },
      { value: 3, label: "Good - adequate for the role" },
      { value: 2, label: "Fair - still improving" },
      { value: 1, label: "Poor - not at required level" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m5_proactive_communication",
    section: "Communication Maturity",
    sectionEmoji: "💬",
    question: "How proactively do they communicate with you?",
    description: "Updates, issues, questions, status reports",
    contextNote: "For permanence: You can't babysit them forever. Do they keep you in the loop?",
    type: "rating",
    options: [
      { value: 5, label: "Exemplary - keeps me perfectly informed" },
      { value: 4, label: "Very good - proactive communication" },
      { value: 3, label: "Adequate - communicates when needed" },
      { value: 2, label: "Poor - have to chase them" },
      { value: 1, label: "Very poor - communication breakdowns" },
    ],
    required: true,
  },

  // SECTION 3: WORK QUALITY & MASTERY
  {
    id: "m5_work_quality_now",
    section: "Work Quality & Mastery",
    sectionEmoji: "✨",
    question: "How would you rate their work quality NOW?",
    description: "Current state after 5 months",
    contextNote: "For permanence: Is the quality where it needs to be for the long haul?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - consistently exceeds standards" },
      { value: 4, label: "Very good - reliably meets/exceeds standards" },
      { value: 3, label: "Good - meets standards, occasional errors" },
      { value: 2, label: "Fair - below standards too often" },
      { value: 1, label: "Poor - quality concerns remain" },
    ],
    required: true,
  },
  {
    id: "m5_improvement_trajectory",
    section: "Work Quality & Mastery",
    sectionEmoji: "✨",
    question: "How much have they improved from Month 1 to now?",
    description: "Growth trajectory over probation",
    contextNote: "For permanence: Are they still learning and growing?",
    type: "rating",
    options: [
      { value: 5, label: "Dramatic improvement - completely different person" },
      { value: 4, label: "Significant improvement - clear growth" },
      { value: 3, label: "Moderate improvement - getting better" },
      { value: 2, label: "Minimal improvement - stagnant" },
      { value: 1, label: "No improvement or declined" },
    ],
    required: true,
  },
  {
    id: "m5_independence_now",
    section: "Work Quality & Mastery",
    sectionEmoji: "✨",
    question: "How independently do they work NOW?",
    description: "Current supervision needs",
    contextNote: "For permanence: Can you trust them to work without constant oversight?",
    type: "rating",
    options: [
      { value: 5, label: "Fully autonomous - I barely need to manage them" },
      { value: 4, label: "Mostly independent - minimal oversight needed" },
      { value: 3, label: "Somewhat independent - regular check-ins needed" },
      { value: 2, label: "Still needs significant supervision" },
      { value: 1, label: "Cannot work independently" },
    ],
    required: true,
  },
  {
    id: "m5_productivity_roi",
    section: "Work Quality & Mastery",
    sectionEmoji: "✨",
    question: "How productive are they compared to your expectations?",
    description: "Output, efficiency, getting things done",
    contextNote: "For permanence: Are you getting good ROI?",
    type: "rating",
    options: [
      { value: 5, label: "Exceptional - far exceeds expectations" },
      { value: 4, label: "Strong - meets/exceeds expectations" },
      { value: 3, label: "Adequate - meets basic expectations" },
      { value: 2, label: "Below - not productive enough" },
      { value: 1, label: "Poor - productivity is a problem" },
    ],
    required: true,
  },
  {
    id: "m5_deadline_reliability",
    section: "Work Quality & Mastery",
    sectionEmoji: "✨",
    question: "Do they consistently meet deadlines?",
    description: "Reliable delivery of work on time",
    contextNote: "For permanence: Can you rely on them for time-sensitive work?",
    type: "rating",
    options: [
      { value: 5, label: "Always - never misses deadlines" },
      { value: 4, label: "Usually - very reliable" },
      { value: 3, label: "Sometimes - occasional delays" },
      { value: 2, label: "Frequently - often needs extensions" },
      { value: 1, label: "Rarely - deadline issues" },
    ],
    required: true,
  },

  // SECTION 4: PROBLEM-SOLVING & OWNERSHIP
  {
    id: "m5_problem_solving",
    section: "Problem-Solving & Ownership",
    sectionEmoji: "🎯",
    question: "How well do they handle problems independently?",
    description: "Troubleshooting, critical thinking, resourcefulness",
    contextNote: "For permanence: Will they be a problem-solver or a problem-creator?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - solves problems without my involvement" },
      { value: 4, label: "Good - usually figures it out, minimal help needed" },
      { value: 3, label: "Adequate - needs guidance but tries" },
      { value: 2, label: "Poor - struggles, needs hand-holding" },
      { value: 1, label: "Very poor - can't problem-solve" },
    ],
    required: true,
  },
  {
    id: "m5_ownership",
    section: "Problem-Solving & Ownership",
    sectionEmoji: "🎯",
    question: "How much ownership do they take over their work?",
    description: "Accountability, responsibility, pride in work",
    contextNote: "For permanence: Do they care about YOUR success?",
    type: "rating",
    options: [
      { value: 5, label: "Total ownership - treats it like their own business" },
      { value: 4, label: "Strong ownership - cares about outcomes" },
      { value: 3, label: "Adequate - does the job" },
      { value: 2, label: "Low ownership - just going through motions" },
      { value: 1, label: "No ownership - doesn't care" },
    ],
    required: true,
  },
  {
    id: "m5_proactivity_innovation",
    section: "Problem-Solving & Ownership",
    sectionEmoji: "🎯",
    question: "How proactive are they in improving processes or suggesting ideas?",
    description: "Initiative, innovation, contribution beyond tasks",
    contextNote: "For permanence: Will they help your business grow or just maintain status quo?",
    type: "rating",
    options: [
      { value: 5, label: "Highly proactive - constantly improving things" },
      { value: 4, label: "Proactive - regularly brings ideas" },
      { value: 3, label: "Adequate - occasionally suggests improvements" },
      { value: 2, label: "Reactive - only does what's asked" },
      { value: 1, label: "Passive - no initiative" },
    ],
    required: true,
  },

  // SECTION 5: PROFESSIONALISM & CULTURE FIT
  {
    id: "m5_brand_representation",
    section: "Professionalism & Culture Fit",
    sectionEmoji: "🤝",
    question: "How well do they represent your business/brand?",
    description: "Professionalism with your clients, partners, stakeholders",
    contextNote: "For permanence: Can they be the face of your company?",
    type: "rating",
    options: [
      { value: 5, label: "Exemplary - I trust them completely with anyone" },
      { value: 4, label: "Very professional - represents us well" },
      { value: 3, label: "Professional - adequate representation" },
      { value: 2, label: "Concerns - not always appropriate" },
      { value: 1, label: "Poor - cannot represent our brand" },
    ],
    required: true,
    showNA: true,
  },
  {
    id: "m5_feedback_coachability",
    section: "Professionalism & Culture Fit",
    sectionEmoji: "🤝",
    question: "How well do they respond to feedback and coaching?",
    description: "Coachability, growth mindset, ego management",
    contextNote: "For permanence: Can they continue growing with your business?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - loves feedback, implements immediately" },
      { value: 4, label: "Good - receptive and improves" },
      { value: 3, label: "Adequate - accepts feedback" },
      { value: 2, label: "Poor - sometimes defensive" },
      { value: 1, label: "Very poor - resistant to feedback" },
    ],
    required: true,
  },
  {
    id: "m5_culture_fit",
    section: "Professionalism & Culture Fit",
    sectionEmoji: "🤝",
    question: "How well do they fit with your team/company culture?",
    description: "Values alignment, team dynamics, cultural match",
    contextNote: "For permanence: Will they thrive in your environment long-term?",
    type: "rating",
    options: [
      { value: 5, label: "Perfect fit - embodies our values" },
      { value: 4, label: "Strong fit - meshes well" },
      { value: 3, label: "Adequate fit - works okay" },
      { value: 2, label: "Poor fit - some friction" },
      { value: 1, label: "Bad fit - cultural mismatch" },
    ],
    required: true,
  },
  {
    id: "m5_business_understanding",
    section: "Professionalism & Culture Fit",
    sectionEmoji: "🤝",
    question: "How much do they understand YOUR business now?",
    description: "Industry knowledge, company goals, strategic understanding",
    contextNote: "For permanence: Do they understand WHY they do what they do?",
    type: "rating",
    options: [
      { value: 5, label: "Deep understanding - gets the big picture" },
      { value: 4, label: "Good understanding - knows what matters" },
      { value: 3, label: "Basic understanding - knows their role" },
      { value: 2, label: "Limited understanding - still learning basics" },
      { value: 1, label: "Poor understanding - doesn't get it" },
    ],
    required: true,
  },

  // SECTION 6: LONG-TERM VALUE ASSESSMENT
  {
    id: "m5_overall_value",
    section: "Long-Term Value Assessment",
    sectionEmoji: "💼",
    question: "What is the overall value they bring to your business?",
    description: "ROI, impact, contribution",
    contextNote: "For permanence: Is the investment worth it for the long term?",
    type: "rating",
    options: [
      { value: 5, label: "Exceptional value - invaluable team member" },
      { value: 4, label: "Strong value - definitely worth the investment" },
      { value: 3, label: "Fair value - meeting expectations" },
      { value: 2, label: "Limited value - not meeting expectations" },
      { value: 1, label: "Little/no value - not working out" },
    ],
    required: true,
  },
  {
    id: "m5_impact_if_left",
    section: "Long-Term Value Assessment",
    sectionEmoji: "💼",
    question: "How much would it impact your business if they left?",
    description: "Honest assessment of their importance",
    contextNote: "For permanence: Are they becoming integral to your operations?",
    type: "rating",
    options: [
      { value: 5, label: "Major impact - would be very difficult to replace" },
      { value: 4, label: "Significant impact - would prefer to keep them" },
      { value: 3, label: "Moderate impact - replaceable but inconvenient" },
      { value: 2, label: "Minor impact - wouldn't significantly affect us" },
      { value: 1, label: "No impact - wouldn't miss them" },
    ],
    required: true,
  },
  {
    id: "m5_growth_potential",
    section: "Long-Term Value Assessment",
    sectionEmoji: "💼",
    question: "Do you see growth potential in this person?",
    description: "Can they take on more responsibility over time?",
    contextNote: "For permanence: Is this someone you can invest in for years?",
    type: "rating",
    options: [
      { value: 5, label: "High potential - can grow significantly with us" },
      { value: 4, label: "Good potential - can take on more over time" },
      { value: 3, label: "Some potential - probably stay at current level" },
      { value: 2, label: "Limited potential - likely peaked" },
      { value: 1, label: "No potential - can't see them growing" },
    ],
    required: true,
  },
  {
    id: "m5_imagine_longterm",
    section: "Long-Term Value Assessment",
    sectionEmoji: "💼",
    question: "Can you imagine them still on your team 1-2 years from now?",
    description: "Gut check - long-term fit",
    contextNote: "For permanence: This is THE question. Trust your gut.",
    type: "rating",
    options: [
      { value: 5, label: "Absolutely - want them long-term" },
      { value: 4, label: "Yes - see them staying" },
      { value: 3, label: "Maybe - depends on continued improvement" },
      { value: 2, label: "Probably not - likely won't work long-term" },
      { value: 1, label: "No - can't see it working" },
    ],
    required: true,
  },
  {
    id: "m5_overall_satisfaction",
    section: "Long-Term Value Assessment",
    sectionEmoji: "💼",
    question: "Overall satisfaction with this team member after 5 months:",
    type: "rating",
    options: [
      { value: 5, label: "Extremely satisfied - exceeded expectations" },
      { value: 4, label: "Very satisfied - met expectations" },
      { value: 3, label: "Satisfied - acceptable performance" },
      { value: 2, label: "Dissatisfied - below expectations" },
      { value: 1, label: "Very dissatisfied - not working out" },
    ],
    required: true,
  },

  // SECTION 7: FINAL DECISION DETAILS
  {
    id: "m5_greatest_strengths",
    section: "Final Decision Details",
    sectionEmoji: "📝",
    question: "What are their 3 GREATEST STRENGTHS?",
    description: "What makes them valuable? Why would you keep them?",
    type: "text",
    required: true,
  },
  {
    id: "m5_biggest_weaknesses",
    section: "Final Decision Details",
    sectionEmoji: "📝",
    question: "What are their 3 BIGGEST WEAKNESSES or areas that still need work?",
    description: "Be honest - what concerns remain?",
    type: "text",
    required: true,
  },
  {
    id: "m5_year1_development",
    section: "Final Decision Details",
    sectionEmoji: "📝",
    question: "If you're recommending regularization, what development areas should they focus on in Year 1?",
    description: "What should they work on once they're permanent?",
    type: "text",
    required: false,
  },
  {
    id: "m5_not_recommending_why",
    section: "Final Decision Details",
    sectionEmoji: "📝",
    question: "If you're NOT recommending regularization, please explain specifically why:",
    description: "What are the dealbreakers? What didn't work?",
    type: "text",
    required: false,
  },
  {
    id: "m5_final_comments",
    section: "Final Decision Details",
    sectionEmoji: "📝",
    question: "Any final comments, concerns, or recommendations for Shore Agents?",
    type: "text",
    required: false,
  },
]

// 🔄 6-MONTH RECURRING: Ongoing Check-Ins (24 questions + trend tracking)
export const RECURRING_6M_QUESTIONS: ReviewQuestion[] = [
  {
    id: "r6m_instant_truth",
    section: "⚡ The Instant Truth",
    sectionEmoji: "⚡",
    question: "Overall, how has this team member performed over the past 6 months?",
    type: "select",
    options: [
      { value: "getting_better", label: "🚀 GETTING BETTER - Performance improving" },
      { value: "consistently_strong", label: "✅ CONSISTENTLY STRONG - Steady, reliable" },
      { value: "plateaued", label: "😐 PLATEAUED - Not growing" },
      { value: "slipping", label: "⚠️ SLIPPING - Performance declining" },
      { value: "serious_problems", label: "🚨 SERIOUS PROBLEMS - Major issues" },
    ],
    required: true,
  },
  {
    id: "r6m_trend",
    section: "📈 Trend Check",
    sectionEmoji: "📈",
    question: "Since the last evaluation, has their performance:",
    type: "select",
    options: [
      { value: "significantly_improved", label: "Significantly improved" },
      { value: "slightly_improved", label: "Slightly improved" },
      { value: "stayed_same", label: "Stayed the same" },
      { value: "slightly_declined", label: "Slightly declined" },
      { value: "significantly_declined", label: "Significantly declined" },
    ],
    required: true,
  },
  {
    id: "r6m_attendance",
    section: "Reliability & Consistency",
    sectionEmoji: "📊",
    question: "Attendance and availability over the past 6 months:",
    type: "rating",
    options: [
      { value: 5, label: "Perfect, zero issues" },
      { value: 4, label: "Very reliable, rare exceptions" },
      { value: 3, label: "Generally reliable, occasional issues" },
      { value: 2, label: "Reliability concerns" },
      { value: 1, label: "Unreliable" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_consistency",
    section: "Reliability & Consistency",
    sectionEmoji: "📊",
    question: "How consistent is their performance week-to-week?",
    type: "rating",
    options: [
      { value: 5, label: "Rock solid consistency" },
      { value: 4, label: "Very consistent" },
      { value: 3, label: "Somewhat inconsistent" },
      { value: 2, label: "Very inconsistent" },
      { value: 1, label: "All over the place" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_response_time",
    section: "Reliability & Consistency",
    sectionEmoji: "📊",
    question: "Response time to your messages and requests:",
    type: "rating",
    options: [
      { value: 5, label: "Always immediate" },
      { value: 4, label: "Very responsive" },
      { value: 3, label: "Adequate" },
      { value: 2, label: "Often slow" },
      { value: 1, label: "Unresponsive" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_work_quality",
    section: "Work Quality & Output",
    sectionEmoji: "✨",
    question: "Quality of work delivered:",
    type: "rating",
    options: [
      { value: 5, label: "Exceptional quality" },
      { value: 4, label: "Strong quality" },
      { value: 3, label: "Acceptable quality" },
      { value: 2, label: "Below standards" },
      { value: 1, label: "Poor quality" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_productivity",
    section: "Work Quality & Output",
    sectionEmoji: "✨",
    question: "Productivity and output volume:",
    type: "rating",
    options: [
      { value: 5, label: "Highly productive" },
      { value: 4, label: "Productive" },
      { value: 3, label: "Adequate" },
      { value: 2, label: "Below expectations" },
      { value: 1, label: "Unproductive" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_deadlines",
    section: "Work Quality & Output",
    sectionEmoji: "✨",
    question: "Meeting deadlines consistently:",
    type: "rating",
    options: [
      { value: 5, label: "Always on time" },
      { value: 4, label: "Usually on time" },
      { value: 3, label: "Sometimes late" },
      { value: 2, label: "Frequently late" },
      { value: 1, label: "Rarely on time" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_communication_quality",
    section: "Communication & Proactivity",
    sectionEmoji: "💬",
    question: "Communication quality (written and verbal):",
    type: "rating",
    options: [
      { value: 5, label: "Excellent" },
      { value: 4, label: "Good" },
      { value: 3, label: "Adequate" },
      { value: 2, label: "Poor" },
      { value: 1, label: "Major issues" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_proactive_communication",
    section: "Communication & Proactivity",
    sectionEmoji: "💬",
    question: "Proactive communication (updates, flagging issues):",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - always in the loop" },
      { value: 4, label: "Good - usually proactive" },
      { value: 3, label: "Adequate" },
      { value: 2, label: "Poor - have to chase" },
      { value: 1, label: "Leaves me in the dark" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_independence",
    section: "Problem-Solving & Ownership",
    sectionEmoji: "🎯",
    question: "How independently do they work?",
    type: "rating",
    options: [
      { value: 5, label: "Fully autonomous" },
      { value: 4, label: "Mostly independent" },
      { value: 3, label: "Needs regular oversight" },
      { value: 2, label: "Requires hand-holding" },
      { value: 1, label: "Cannot work independently" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_problem_solving",
    section: "Problem-Solving & Ownership",
    sectionEmoji: "🎯",
    question: "Problem-solving ability:",
    type: "rating",
    options: [
      { value: 5, label: "Excellent" },
      { value: 4, label: "Good" },
      { value: 3, label: "Adequate" },
      { value: 2, label: "Poor" },
      { value: 1, label: "Cannot problem-solve" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_initiative",
    section: "Problem-Solving & Ownership",
    sectionEmoji: "🎯",
    question: "Initiative and proactivity:",
    type: "rating",
    options: [
      { value: 5, label: "Highly proactive" },
      { value: 4, label: "Proactive" },
      { value: 3, label: "Adequate" },
      { value: 2, label: "Reactive" },
      { value: 1, label: "Passive" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_ownership",
    section: "Problem-Solving & Ownership",
    sectionEmoji: "🎯",
    question: "Ownership and accountability:",
    type: "rating",
    options: [
      { value: 5, label: "Total ownership" },
      { value: 4, label: "Strong ownership" },
      { value: 3, label: "Adequate" },
      { value: 2, label: "Low ownership" },
      { value: 1, label: "No accountability" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_professionalism",
    section: "Professionalism & Growth",
    sectionEmoji: "🤝",
    question: "Professionalism in all interactions:",
    type: "rating",
    options: [
      { value: 5, label: "Exemplary" },
      { value: 4, label: "Very professional" },
      { value: 3, label: "Generally professional" },
      { value: 2, label: "Occasional issues" },
      { value: 1, label: "Unprofessional" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_feedback_response",
    section: "Professionalism & Growth",
    sectionEmoji: "🤝",
    question: "How well do they respond to feedback?",
    type: "rating",
    options: [
      { value: 5, label: "Excellent - implements immediately" },
      { value: 4, label: "Good - receptive" },
      { value: 3, label: "Adequate" },
      { value: 2, label: "Defensive" },
      { value: 1, label: "Resistant" },
    ],
    required: true,
    hasTrend: true,
  },
  {
    id: "r6m_growth",
    section: "Professionalism & Growth",
    sectionEmoji: "🤝",
    question: "Are they growing and developing in the role?",
    type: "rating",
    options: [
      { value: 5, label: "Significant growth" },
      { value: 4, label: "Steady growth" },
      { value: 3, label: "Some growth" },
      { value: 2, label: "Stagnant" },
      { value: 1, label: "Declining" },
    ],
    required: true,
  },
  {
    id: "r6m_current_value",
    section: "Value & Relationship Health",
    sectionEmoji: "💼",
    question: "Current value they provide to your business:",
    type: "rating",
    options: [
      { value: 5, label: "Exceptional value" },
      { value: 4, label: "Strong value" },
      { value: 3, label: "Fair value" },
      { value: 2, label: "Limited value" },
      { value: 1, label: "Little/no value" },
    ],
    required: true,
  },
  {
    id: "r6m_satisfaction",
    section: "Value & Relationship Health",
    sectionEmoji: "💼",
    question: "Your current satisfaction with this team member:",
    type: "rating",
    options: [
      { value: 5, label: "Extremely satisfied" },
      { value: 4, label: "Very satisfied" },
      { value: 3, label: "Satisfied" },
      { value: 2, label: "Dissatisfied" },
      { value: 1, label: "Very dissatisfied" },
    ],
    required: true,
  },
  {
    id: "r6m_likelihood_continue",
    section: "Value & Relationship Health",
    sectionEmoji: "💼",
    question: "How likely are you to continue working with this team member?",
    type: "rating",
    options: [
      { value: 5, label: "Definitely continuing" },
      { value: 4, label: "Likely continuing" },
      { value: 3, label: "Uncertain" },
      { value: 2, label: "Unlikely" },
      { value: 1, label: "Want to make a change" },
    ],
    required: true,
  },
  {
    id: "r6m_one_thing_to_change",
    section: "Value & Relationship Health",
    sectionEmoji: "💼",
    question: "If you could change ONE thing about this team member, what would it be?",
    type: "text",
    required: false,
  },
  {
    id: "r6m_doing_well",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "What are they doing REALLY WELL right now?",
    description: "Top 2-3 strengths",
    type: "text",
    required: true,
  },
  {
    id: "r6m_needs_improvement",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "What specific areas need improvement?",
    description: "Top 2-3 development areas",
    type: "text",
    required: true,
  },
  {
    id: "r6m_support_needed",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "What support do you need from Shore Agents?",
    type: "text",
    required: false,
  },
  {
    id: "r6m_other_comments",
    section: "Detailed Feedback",
    sectionEmoji: "📝",
    question: "Any other concerns, feedback, or comments?",
    type: "text",
    required: false,
  },
]

// Helper function to get questions by review type
export function getQuestionsForReview(type: ReviewType): ReviewQuestion[] {
  switch (type) {
    case "month_1":
      return MONTH_1_QUESTIONS
    case "month_3":
      return MONTH_3_QUESTIONS
    case "month_5":
      return MONTH_5_QUESTIONS
    case "recurring_6m":
      return RECURRING_6M_QUESTIONS
    case "ad_hoc":
      return MONTH_1_QUESTIONS // Or custom
    default:
      return MONTH_1_QUESTIONS
  }
}

// Helper to get review type label
export function getReviewTypeLabel(type: ReviewType): string {
  const labels = {
    month_1: "🔵 Month 1 Review",
    month_3: "🟢 Month 3 Review",
    month_5: "🟣 Month 5 - Regularization Decision",
    recurring_6m: "🔄 6-Month Check-In",
    ad_hoc: "💬 Performance Feedback",
  }
  return labels[type] || "Review"
}

// Calculate overall score from answers
export function calculateOverallScore(answers: Record<string, any>): number {
  const ratingAnswers = Object.values(answers).filter(
    (answer: any) => 
      answer && 
      typeof answer.value === "number" && 
      answer.value >= 1 && 
      answer.value <= 5
  ).map((answer: any) => answer.value) as number[]

  if (ratingAnswers.length === 0) return 0

  const sum = ratingAnswers.reduce((acc, val) => acc + val, 0)
  return parseFloat((sum / ratingAnswers.length).toFixed(1))
}

// Group questions by section
export function groupQuestionsBySection(questions: ReviewQuestion[]): Map<string, ReviewQuestion[]> {
  const grouped = new Map<string, ReviewQuestion[]>()
  
  questions.forEach(question => {
    const key = `${question.sectionEmoji} ${question.section}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(question)
  })
  
  return grouped
}
