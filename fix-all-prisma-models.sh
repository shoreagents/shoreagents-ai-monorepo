#!/bin/bash
echo "🔧 Fixing ALL Prisma model names across the entire codebase..."

# Find all .ts and .tsx files (excluding node_modules and .next)
echo "🔍 Scanning .ts and .tsx files..."

find . -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "./node_modules/*" \
  -not -path "./prisma/seed.ts" \
  -not -path "./.next/*" \
  -not -path "./fix-*.sh" | while read -r file; do
  
  # Perform all replacements using sed
  sed -i '' \
    -e 's/prisma\.staffUser\b/prisma.staff_users/g' \
    -e 's/prisma\.clientUser\b/prisma.client_users/g' \
    -e 's/prisma\.managementUser\b/prisma.management_users/g' \
    -e 's/prisma\.timeEntry\b/prisma.time_entries/g' \
    -e 's/prisma\.break\b/prisma.breaks/g' \
    -e 's/prisma\.task\b/prisma.tasks/g' \
    -e 's/prisma\.ticket\b/prisma.tickets/g' \
    -e 's/prisma\.review\b/prisma.reviews/g' \
    -e 's/prisma\.activityPost\b/prisma.activity_posts/g' \
    -e 's/prisma\.performanceMetric\b/prisma.performance_metrics/g' \
    -e 's/prisma\.interviewRequest\b/prisma.interview_requests/g' \
    -e 's/prisma\.bpocCandidate\b/prisma.bpoc_candidates/g' \
    -e 's/prisma\.jobAcceptance\b/prisma.job_acceptances/g' \
    -e 's/prisma\.clientProfile\b/prisma.client_profiles/g' \
    -e 's/prisma\.staffProfile\b/prisma.staff_profiles/g' \
    -e 's/prisma\.managementProfile\b/prisma.management_profiles/g' \
    -e 's/prisma\.postComment\b/prisma.post_comments/g' \
    -e 's/prisma\.postReaction\b/prisma.post_reactions/g' \
    -e 's/prisma\.ticketResponse\b/prisma.ticket_responses/g' \
    -e 's/prisma\.taskResponse\b/prisma.task_responses/g' \
    -e 's/prisma\.taskAssignment\b/prisma.task_assignments/g' \
    "$file" 2>/dev/null
    
done

echo ""
echo "✅ Done! All Prisma model names have been fixed."
echo "🔄 The Next.js dev server should hot-reload automatically."
