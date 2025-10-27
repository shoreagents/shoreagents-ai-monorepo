#!/bin/bash
# Fix all camelCase Prisma model names to snake_case

cd /Users/stephenatcheler/Documents/GitHub/shoreagents-ai-monorepo

echo "Fixing Prisma model names..."

# Fix in all TS/TSX files
find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's/prisma\.staffUser/prisma.staff_users/g' \
  -e 's/prisma\.clientUser/prisma.client_users/g' \
  -e 's/prisma\.managementUser/prisma.management_users/g' \
  -e 's/prisma\.timeEntry/prisma.time_entries/g' \
  -e 's/prisma\.break\b/prisma.breaks/g' \
  -e 's/prisma\.task\b/prisma.tasks/g' \
  -e 's/prisma\.ticket\b/prisma.tickets/g' \
  -e 's/prisma\.review\b/prisma.reviews/g' \
  {} +

echo "✅ Done! Fixed all Prisma model names."

