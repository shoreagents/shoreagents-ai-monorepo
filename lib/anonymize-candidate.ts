/**
 * Candidate Anonymization Utility
 * 
 * Removes personal identifying information from candidate profiles
 * before showing them to clients. Clients should only see professional
 * data, not contact details or full names.
 */

/**
 * Anonymize candidate for list view (cards)
 * Shows minimal data to intrigue clients
 */
export function anonymizeCandidateForList(candidate: any) {
  const resumeData = candidate.resume_data || {}
  const culturalResults = candidate.cultural_results || {}

  // Calculate years of experience from resume
  const experienceYears = resumeData.experience?.length || 0

  // Get top skills (max 5)
  const skills = (resumeData.skills || []).slice(0, 5)

  // Get cultural fit score
  const culturalFitScore = parseInt(culturalResults.overallScore) || null

  // Get DISC primary type (from direct column, not nested object)
  const discType = candidate.latest_primary_type || null

  return {
    id: candidate.id,
    firstName: candidate.first_name,
    avatar: candidate.avatar_url,
    position: candidate.position || 'Professional',
    location: formatLocation(candidate),
    bio: candidate.bio ? truncateText(candidate.bio, 150) : null,
    
    // Professional highlights
    skills,
    experienceYears,
    
    // Assessment scores (make them intriguing!)
    culturalFitScore,
    discType,
    typingWpm: candidate.typing_wpm || null,
    leaderboardScore: candidate.leaderboard_score || null,
    
    // NO personal contact details
    // NO last name
    // NO email
    // NO phone
  }
}

/**
 * Anonymize candidate for full profile view
 * Shows comprehensive professional data but still no contact details
 */
export function anonymizeCandidateForProfile(candidate: any) {
  const resumeData = candidate.resume_data || {}
  const culturalResults = candidate.cultural_results || {}
  const aiAnalysis = candidate.ai_analysis || {}

  return {
    id: candidate.id,
    firstName: candidate.first_name,
    avatar: candidate.avatar_url,
    position: candidate.position || 'Professional',
    location: formatLocation(candidate),
    bio: candidate.bio,
    memberSince: candidate.created_at,
    
    // Resume Data (anonymized)
    resume: {
      summary: resumeData.summary,
      skills: resumeData.skills || [],
      experience: anonymizeExperience(resumeData.experience || []),
      education: anonymizeEducation(resumeData.education || []),
      certifications: resumeData.certifications || [],
      languages: resumeData.languages || [],
    },
    
    // Assessment Results (FULL DATA - this is the value!)
    assessments: {
      cultural: {
        score: parseInt(culturalResults.overallScore) || null,
        summary: culturalResults.summary || culturalResults.culturalSummary,
        details: culturalResults.details || {},
        traits: culturalResults.traits || [],
      },
      disc: {
        primaryType: candidate.latest_primary_type,
        secondaryType: candidate.latest_secondary_type,
        description: candidate.latest_ai_assessment || '',
        scores: {
          dominance: candidate.d_score || 0,
          influence: candidate.i_score || 0,
          steadiness: candidate.s_score || 0,
          conscientiousness: candidate.c_score || 0,
        },
        strengths: [], // Not in current schema
        weaknesses: [], // Not in current schema
        workStyle: [], // Not in current schema
      },
      typing: {
        wpm: candidate.typing_wpm,
        accuracy: candidate.typing_accuracy,
        consistency: candidate.consistency_score,
      },
      leaderboard: {
        totalScore: candidate.leaderboard_score,
        profileCompletion: candidate.profile_completion_score,
        assessmentScore: candidate.assessment_score,
        activityScore: candidate.activity_score,
      },
    },
    
    // AI Analysis Results (FULL DATA - this is premium value!)
    aiAnalysis: {
      summary: aiAnalysis.summary,
      strengths: aiAnalysis.strengths || [],
      areasForGrowth: aiAnalysis.areasForGrowth || [],
      recommendations: aiAnalysis.recommendations || [],
      fitScore: aiAnalysis.fitScore,
      details: aiAnalysis.details || {},
    },
    
    // NO personal contact details
    // NO last name
    // NO email
    // NO phone
    // NO applications history
  }
}

/**
 * Anonymize work experience
 * Keep roles and responsibilities but optionally hide company names for extreme privacy
 */
function anonymizeExperience(experience: any[]) {
  return experience.map(exp => ({
    position: exp.position,
    company: exp.company, // Can show or hide based on requirements
    duration: exp.duration,
    description: exp.description,
    // Redact any contact info in descriptions
  }))
}

/**
 * Anonymize education
 * Keep degrees and institutions (public info)
 */
function anonymizeEducation(education: any[]) {
  return education.map(edu => ({
    degree: edu.degree,
    institution: edu.institution,
    year: edu.year,
    major: edu.major,
    gpa: edu.gpa, // Optional
  }))
}

/**
 * Format location for display
 */
function formatLocation(candidate: any): string {
  const parts = []
  
  if (candidate.location_city) parts.push(candidate.location_city)
  if (candidate.location_province) parts.push(candidate.location_province)
  if (candidate.location_country) parts.push(candidate.location_country)
  
  return parts.join(', ') || 'Location not specified'
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Calculate experience level from years
 */
export function getExperienceLevel(years: number): string {
  if (years === 0) return 'Entry Level'
  if (years <= 2) return 'Junior'
  if (years <= 5) return 'Mid-Level'
  if (years <= 10) return 'Senior'
  return 'Expert'
}

/**
 * Get badge color for cultural fit score
 */
export function getCulturalFitBadgeColor(score: number): string {
  if (score >= 90) return 'bg-green-500'
  if (score >= 75) return 'bg-blue-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-gray-500'
}

/**
 * Get DISC type color
 */
export function getDiscTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'D': 'bg-red-500',
    'I': 'bg-yellow-500',
    'S': 'bg-green-500',
    'C': 'bg-blue-500',
  }
  return colors[type?.toUpperCase()] || 'bg-gray-500'
}

