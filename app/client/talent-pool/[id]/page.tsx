"use client"

/**
 * Client Candidate Profile Page
 * 
 * Comprehensive candidate profile with AI analysis, DISC results,
 * cultural fit assessment, and professional history
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Calendar, Star, Zap, Brain, Target,
  Award, Book, Languages, TrendingUp, Clock, MessageSquare,
  X, Plus, Video, FileText, CheckCircle
} from 'lucide-react'

interface CandidateProfile {
  id: string
  firstName: string
  avatar: string | null
  position: string
  location: string
  bio: string
  memberSince: string
  resume: {
    summary: string
    skills: string[]
    experience: any[]
    education: any[]
    certifications: any[]
    languages: any[]
  }
  assessments: {
    cultural: {
      score: number | null
      summary: string
      details: any
      traits: any[]
    }
    disc: {
      primaryType: string
      secondaryType: string
      description: string
      scores: {
        dominance: number
        influence: number
        steadiness: number
        conscientiousness: number
      }
      strengths: string[]
      weaknesses: string[]
      workStyle: string[]
    }
    typing: {
      wpm: number | null
      accuracy: number | null
      consistency: number | null
    }
    leaderboard: {
      totalScore: number | null
      profileCompletion: number | null
      assessmentScore: number | null
      activityScore: number | null
    }
  }
  aiAnalysis: {
    summary: string
    strengths: string[]
    areasForGrowth: string[]
    recommendations: string[]
    fitScore: number | null
    details: any
  }
}

type TabType = 'overview' | 'personality' | 'professional' | 'assessments'

export default function CandidateProfilePage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    fetchCandidate()
  }, [candidateId])

  async function fetchCandidate() {
    try {
      setLoading(true)
      const response = await fetch(`/api/client/candidates/${candidateId}`)
      const data = await response.json()

      if (data.success) {
        setCandidate(data.candidate)
      } else {
        console.error('Failed to fetch candidate')
      }
    } catch (error) {
      console.error('Error fetching candidate:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Candidate not found</h2>
          <button
            onClick={() => router.push('/client/talent-pool')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Talent Pool
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/client/talent-pool')}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Talent Pool
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            {candidate.avatar ? (
              <img
                src={candidate.avatar}
                alt={candidate.firstName}
                className="w-32 h-32 rounded-full border-4 border-white shadow-2xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl bg-white/20 flex items-center justify-center text-5xl font-bold">
                {candidate.firstName[0]}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{candidate.firstName}</h1>
              <p className="text-xl text-white/90 mb-3">{candidate.position}</p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {candidate.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(candidate.memberSince).toLocaleDateString()}
                </div>
              </div>

              {/* Key Scores */}
              <div className="flex flex-wrap gap-3 mt-4">
                {candidate.assessments.cultural.score && (
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      <div>
                        <div className="text-xs text-white/80">Cultural Fit</div>
                        <div className="font-bold text-lg">{candidate.assessments.cultural.score}%</div>
                      </div>
                    </div>
                  </div>
                )}
                {candidate.assessments.disc.primaryType && (
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      <div>
                        <div className="text-xs text-white/80">DISC Type</div>
                        <div className="font-bold text-lg">{candidate.assessments.disc.primaryType}</div>
                      </div>
                    </div>
                  </div>
                )}
                {candidate.assessments.typing.wpm && (
                  <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <div>
                        <div className="text-xs text-white/80">Typing Speed</div>
                        <div className="font-bold text-lg">{candidate.assessments.typing.wpm} WPM</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={Brain}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'personality'}
              onClick={() => setActiveTab('personality')}
              icon={Zap}
              label="Personality"
            />
            <TabButton
              active={activeTab === 'professional'}
              onClick={() => setActiveTab('professional')}
              icon={Award}
              label="Professional"
            />
            <TabButton
              active={activeTab === 'assessments'}
              onClick={() => setActiveTab('assessments')}
              icon={Target}
              label="Assessments"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Tab Content */}
          <div className="lg:col-span-2">
            <div className="animate-fadeIn">
              {activeTab === 'overview' && <OverviewTab candidate={candidate} />}
              {activeTab === 'personality' && <PersonalityTab candidate={candidate} />}
              {activeTab === 'professional' && <ProfessionalTab candidate={candidate} />}
              {activeTab === 'assessments' && <AssessmentsTab candidate={candidate} />}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Request Interview Button */}
            <div className="sticky top-20">
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                Request Interview
              </button>

              {/* Key Highlights */}
              <div className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Key Highlights
                </h3>
                <div className="space-y-3">
                  {candidate.assessments.cultural.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cultural Fit</span>
                      <span className="font-bold text-lg text-blue-600">{candidate.assessments.cultural.score}%</span>
                    </div>
                  )}
                  {candidate.assessments.disc.primaryType && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">DISC Type</span>
                      <span className="font-bold text-blue-600">{candidate.assessments.disc.primaryType}</span>
                    </div>
                  )}
                  {candidate.assessments.typing.wpm && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Typing Speed</span>
                      <span className="font-semibold text-gray-900">{candidate.assessments.typing.wpm} WPM</span>
                    </div>
                  )}
                  {candidate.resume.experience.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Experience</span>
                      <span className="font-semibold text-gray-900">{candidate.resume.experience.length} roles</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Languages */}
              {candidate.resume.languages.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-blue-600" />
                    Languages
                  </h3>
                  <div className="space-y-2">
                    {candidate.resume.languages.map((lang, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{lang.language || lang}</span>
                        {lang.proficiency && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{lang.proficiency}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Skills */}
              {candidate.resume.skills.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Top Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.resume.skills.slice(0, 8).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Interview Modal */}
      {showRequestModal && (
        <RequestInterviewModal
          candidate={candidate}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  )
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all relative
        ${active 
          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 animate-shimmer" />
      )}
    </button>
  )
}

function OverviewTab({ candidate }: { candidate: CandidateProfile }) {
  return (
    <div className="space-y-6">
      {/* Bio */}
      {candidate.bio && (
        <Section title="About" icon={MessageSquare}>
          <p className="text-gray-700 leading-relaxed text-lg">{candidate.bio}</p>
        </Section>
      )}

      {/* AI Analysis */}
      {candidate.aiAnalysis.summary && (
        <Section title="AI Professional Analysis" icon={Brain}>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
              <p className="text-gray-800 leading-relaxed text-lg">{candidate.aiAnalysis.summary}</p>
            </div>
            
            {candidate.aiAnalysis.strengths.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <h4 className="font-bold text-green-700 text-lg">Key Strengths</h4>
                </div>
                <ul className="space-y-2">
                  {candidate.aiAnalysis.strengths.map((strength, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-500 text-xl">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {candidate.aiAnalysis.recommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <h4 className="font-bold text-blue-700 text-lg">Best Suited For</h4>
                </div>
                <ul className="space-y-2">
                  {candidate.aiAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-blue-500 text-xl">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Resume Summary */}
      {candidate.resume.summary && (
        <Section title="Professional Summary" icon={Award}>
          <p className="text-gray-700 leading-relaxed">{candidate.resume.summary}</p>
        </Section>
      )}
    </div>
  )
}

function PersonalityTab({ candidate }: { candidate: CandidateProfile }) {
  return (
    <div className="space-y-6">
      {/* DISC Profile */}
      <Section title="DISC Personality Profile" icon={Zap}>
        <div className="space-y-6">
          {/* Primary & Secondary Types */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-6 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold text-3xl shadow-lg">
                {candidate.assessments.disc.primaryType}
              </div>
              {candidate.assessments.disc.secondaryType && (
                <div className="px-6 py-3 bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-xl font-bold text-2xl shadow-lg">
                  {candidate.assessments.disc.secondaryType}
                </div>
              )}
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">{candidate.assessments.disc.description}</p>
          </div>

          {/* DISC Scores Visual */}
          <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 text-lg">Personality Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DISCBar label="Dominance" score={candidate.assessments.disc.scores.dominance} color="red" />
              <DISCBar label="Influence" score={candidate.assessments.disc.scores.influence} color="yellow" />
              <DISCBar label="Steadiness" score={candidate.assessments.disc.scores.steadiness} color="green" />
              <DISCBar label="Conscientiousness" score={candidate.assessments.disc.scores.conscientiousness} color="blue" />
            </div>
          </div>

          {/* Strengths */}
          {candidate.assessments.disc.strengths.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Personality Strengths</h4>
              <div className="flex flex-wrap gap-3">
                {candidate.assessments.disc.strengths.map((strength, i) => (
                  <span 
                    key={i} 
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Style */}
          {candidate.assessments.disc.workStyle.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Work Style Preferences</h4>
              <ul className="space-y-2">
                {candidate.assessments.disc.workStyle.map((style, i) => (
                  <li key={i} className="text-gray-700 flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-blue-500 text-lg">•</span>
                    <span>{style}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

function ProfessionalTab({ candidate }: { candidate: CandidateProfile }) {
  return (
    <div className="space-y-6">
      {/* Skills */}
      <Section title="Skills & Expertise" icon={Award}>
        <div className="flex flex-wrap gap-3">
          {candidate.resume.skills.map((skill, i) => (
            <span 
              key={i} 
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              {skill}
            </span>
          ))}
        </div>
      </Section>

      {/* Experience */}
      <Section title="Work Experience" icon={Clock}>
        <div className="space-y-6">
          {candidate.resume.experience.map((exp, i) => (
            <div key={i} className="relative pl-6 pb-6 border-l-4 border-blue-500 last:pb-0">
              <div className="absolute left-[-10px] top-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg" />
              <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                <h4 className="font-bold text-gray-900 text-lg">{exp.position}</h4>
                <p className="text-sm text-blue-600 font-medium mt-1">{exp.company} • {exp.duration}</p>
                <p className="text-gray-700 mt-3 leading-relaxed">{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Education */}
      {candidate.resume.education.length > 0 && (
        <Section title="Education" icon={Book}>
          <div className="space-y-4">
            {candidate.resume.education.map((edu, i) => (
              <div key={i} className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200">
                <h4 className="font-bold text-gray-900 text-lg">{edu.degree}</h4>
                <p className="text-sm text-purple-600 font-medium mt-1">{edu.institution} • {edu.year}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {candidate.resume.certifications.length > 0 && (
        <Section title="Certifications & Credentials" icon={Award}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidate.resume.certifications.map((cert, i) => (
              <div key={i} className="p-3 bg-gradient-to-br from-yellow-50 to-white rounded-lg border border-yellow-200 flex items-center gap-3">
                <div className="text-2xl">🏆</div>
                <span className="text-sm text-gray-700 font-medium">{cert.name || cert}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Languages */}
      {candidate.resume.languages.length > 0 && (
        <Section title="Languages" icon={Languages}>
          <div className="grid grid-cols-2 gap-3">
            {candidate.resume.languages.map((lang, i) => (
              <div key={i} className="p-3 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200">
                <div className="font-semibold text-gray-900">{lang.language || lang}</div>
                {lang.proficiency && (
                  <div className="text-sm text-green-600 mt-1">{lang.proficiency}</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function AssessmentsTab({ candidate }: { candidate: CandidateProfile }) {
  return (
    <div className="space-y-6">
      {/* Cultural Fit */}
      {candidate.assessments.cultural.score && (
        <Section title="Cultural Fit Assessment" icon={Star}>
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl border-2 border-purple-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl mb-4">
                <span className="text-5xl font-bold text-white">{candidate.assessments.cultural.score}%</span>
              </div>
              <div className="text-lg font-semibold text-gray-700">Cultural Compatibility Score</div>
            </div>
            {candidate.assessments.cultural.summary && (
              <p className="text-gray-700 leading-relaxed text-center mb-4">{candidate.assessments.cultural.summary}</p>
            )}
            {candidate.assessments.cultural.traits.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {candidate.assessments.cultural.traits.map((trait, i) => (
                  <span key={i} className="px-4 py-2 bg-white text-purple-700 rounded-full text-sm font-medium border-2 border-purple-200 shadow-sm">
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Typing Assessment */}
      {candidate.assessments.typing.wpm && (
        <Section title="Typing Performance" icon={TrendingUp}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{candidate.assessments.typing.wpm}</div>
              <div className="text-sm text-gray-600">Words Per Minute</div>
            </div>
            {candidate.assessments.typing.accuracy && (
              <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{candidate.assessments.typing.accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
            )}
            {candidate.assessments.typing.consistency && (
              <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{candidate.assessments.typing.consistency}%</div>
                <div className="text-sm text-gray-600">Consistency</div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Leaderboard Metrics */}
      {candidate.assessments.leaderboard.totalScore && (
        <Section title="Platform Performance Metrics" icon={Target}>
          <div className="space-y-4">
            <MetricBar 
              label="Overall Score" 
              value={candidate.assessments.leaderboard.totalScore} 
              max={1000}
              color="blue"
            />
            {candidate.assessments.leaderboard.profileCompletion && (
              <MetricBar 
                label="Profile Completion" 
                value={candidate.assessments.leaderboard.profileCompletion} 
                max={100}
                color="green"
              />
            )}
            {candidate.assessments.leaderboard.assessmentScore && (
              <MetricBar 
                label="Assessment Score" 
                value={candidate.assessments.leaderboard.assessmentScore} 
                max={100}
                color="purple"
              />
            )}
            {candidate.assessments.leaderboard.activityScore && (
              <MetricBar 
                label="Activity Score" 
                value={candidate.assessments.leaderboard.activityScore} 
                max={100}
                color="yellow"
              />
            )}
          </div>
        </Section>
      )}
    </div>
  )
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-6 h-6 text-blue-600" />}
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function DISCBar({ label, score, color }: { label: string; score: number; color: string }) {
  const colors = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colors[color as keyof typeof colors]} h-2 rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = (value / max) * 100
  
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="text-gray-900 font-bold">{value} / {max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${colors[color as keyof typeof colors]} h-3 rounded-full transition-all duration-1000 shadow-inner`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function RequestInterviewModal({ candidate, onClose }: { candidate: CandidateProfile; onClose: () => void }) {
  const router = useRouter()
  const [preferredTimes, setPreferredTimes] = useState<string[]>(['', ''])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Filter out empty times
    const times = preferredTimes.filter(t => t.trim() !== '')
    if (times.length === 0) {
      alert('Please provide at least one preferred time')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/client/interviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bpoc_candidate_id: candidate.id,
          preferred_times: times,
          client_notes: notes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/client/interviews')
        }, 2000)
      } else {
        alert('Failed to submit request: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  function addTimeSlot() {
    setPreferredTimes([...preferredTimes, ''])
  }

  function removeTimeSlot(index: number) {
    setPreferredTimes(preferredTimes.filter((_, i) => i !== index))
  }

  function updateTimeSlot(index: number, value: string) {
    const updated = [...preferredTimes]
    updated[index] = value
    setPreferredTimes(updated)
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            We'll review your interview request for {candidate.firstName} and get back to you shortly.
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Redirecting to your interviews...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            {candidate.avatar ? (
              <img
                src={candidate.avatar}
                alt={candidate.firstName}
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center text-2xl font-bold">
                {candidate.firstName[0]}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold mb-1">Request Interview</h2>
              <p className="text-white/90">with {candidate.firstName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-900 font-medium mb-1">Video Interview via Daily.co</p>
                <p className="text-blue-700">
                  Once approved, you'll receive a video call link. The interview will be recorded for quality assurance.
                </p>
              </div>
            </div>
          </div>

          {/* Preferred Times */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Preferred Interview Times
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Provide 2-3 time options that work for you. We'll check availability and confirm.
            </p>
            <div className="space-y-3">
              {preferredTimes.map((time, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="datetime-local"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  {preferredTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {preferredTimes.length < 5 && (
              <button
                type="button"
                onClick={addTimeSlot}
                className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another time option
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Additional Notes <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Any specific requirements, questions, or focus areas for the interview..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-gray-900 bg-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 mt-2">
              This will be shared with our recruitment team to help prepare for the interview.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

