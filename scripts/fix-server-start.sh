#!/bin/bash

# 🔧 Server Fix & Startup Script
# This script checks environment and starts the server cleanly

echo "🔍 Checking Server Environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ CRITICAL: .env.local file not found!"
    echo "📋 Creating template .env.local file..."
    
    cat > .env.local << 'EOF'
# ==================================
# SUPABASE DATABASE CONNECTION
# ==================================
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# ==================================
# SUPABASE API KEYS
# ==================================
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# ==================================
# BPOC DATABASE (CANDIDATE RECRUITMENT)
# ==================================
BPOC_DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]"

# ==================================
# APP CONFIGURATION
# ==================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-random-string-use-openssl-rand-base64-32"

# ==================================
# DAILY.CO VIDEO CALLING
# ==================================
DAILY_API_KEY="your-daily-api-key-here"

# ==================================
# NODE ENVIRONMENT
# ==================================
NODE_ENV="development"
EOF
    
    echo "✅ Created .env.local template"
    echo ""
    echo "🚨 STOP! You need to fill in your credentials in .env.local"
    echo "📝 Open .env.local and replace all [YOUR-...] placeholders"
    echo ""
    echo "📌 Quick guide:"
    echo "   1. DATABASE_URL → Supabase Dashboard → Settings → Database → Transaction mode"
    echo "   2. BPOC_DATABASE_URL → Your Railway/external candidate database"
    echo "   3. NEXTAUTH_SECRET → Run: openssl rand -base64 32"
    echo ""
    exit 1
fi

echo "✅ .env.local exists"

# Check for critical environment variables
source .env.local

if [[ "$DATABASE_URL" == *"[YOUR-"* ]]; then
    echo "❌ ERROR: DATABASE_URL not configured in .env.local"
    echo "   Edit .env.local and add your Supabase connection string"
    exit 1
fi

if [[ "$NEXTAUTH_SECRET" == "change-this"* ]] || [[ "$NEXTAUTH_SECRET" == "generate-"* ]]; then
    echo "⚠️  WARNING: NEXTAUTH_SECRET is still default"
    echo "   Generate one: openssl rand -base64 32"
    echo "   Continuing anyway..."
fi

if [ -z "$BPOC_DATABASE_URL" ] || [[ "$BPOC_DATABASE_URL" == *"[USER]"* ]]; then
    echo "⚠️  WARNING: BPOC_DATABASE_URL not configured"
    echo "   Recruitment features will fail with timeouts"
    echo "   Continuing anyway..."
fi

echo "✅ Environment variables configured"

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean Next.js cache
echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Check if package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo "📦 Regenerating package-lock.json..."
    npm install
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ All checks passed!"
echo "🚀 Starting server..."
echo ""

# Start the dev server
npm run dev

