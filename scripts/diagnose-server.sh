#!/bin/bash

# 🔍 Server Diagnostics Script
# Checks what's wrong with your server setup

echo "🔍 SERVER DIAGNOSTICS REPORT"
echo "=============================="
echo ""

# 1. Check .env.local
echo "1️⃣  ENVIRONMENT FILE"
if [ -f .env.local ]; then
    echo "   ✅ .env.local exists"
    
    # Check critical variables (without exposing values)
    source .env.local
    
    if [ -n "$DATABASE_URL" ]; then
        if [[ "$DATABASE_URL" == *"[YOUR-"* ]]; then
            echo "   ❌ DATABASE_URL is template (not configured)"
        else
            echo "   ✅ DATABASE_URL is set"
        fi
    else
        echo "   ❌ DATABASE_URL is missing"
    fi
    
    if [ -n "$BPOC_DATABASE_URL" ]; then
        if [[ "$BPOC_DATABASE_URL" == *"[USER]"* ]]; then
            echo "   ⚠️  BPOC_DATABASE_URL is template (recruitment will fail)"
        else
            echo "   ✅ BPOC_DATABASE_URL is set"
        fi
    else
        echo "   ❌ BPOC_DATABASE_URL is missing (recruitment will fail)"
    fi
    
    if [ -n "$NEXTAUTH_SECRET" ]; then
        if [[ "$NEXTAUTH_SECRET" == "change-this"* ]] || [[ "$NEXTAUTH_SECRET" == "generate-"* ]]; then
            echo "   ⚠️  NEXTAUTH_SECRET is default (insecure)"
        else
            echo "   ✅ NEXTAUTH_SECRET is set"
        fi
    else
        echo "   ❌ NEXTAUTH_SECRET is missing"
    fi
else
    echo "   ❌ .env.local file NOT FOUND"
    echo "   🚨 CRITICAL: Server cannot start without environment file"
fi

echo ""

# 2. Check Node modules
echo "2️⃣  DEPENDENCIES"
if [ -d node_modules ]; then
    echo "   ✅ node_modules exists"
else
    echo "   ❌ node_modules missing - run: npm install"
fi

if [ -f package-lock.json ]; then
    echo "   ✅ package-lock.json exists"
else
    echo "   ⚠️  package-lock.json missing (in git status as deleted)"
fi

echo ""

# 3. Check Prisma
echo "3️⃣  PRISMA CLIENT"
if [ -d node_modules/@prisma/client ]; then
    echo "   ✅ Prisma client installed"
else
    echo "   ❌ Prisma client missing - run: npx prisma generate"
fi

if [ -f prisma/schema.prisma ]; then
    echo "   ✅ Prisma schema exists"
else
    echo "   ❌ Prisma schema missing"
fi

echo ""

# 4. Check Next.js cache
echo "4️⃣  NEXT.JS CACHE"
if [ -d .next ]; then
    echo "   ⚠️  .next cache exists (may contain stale data)"
    echo "      Recommend: rm -rf .next"
else
    echo "   ✅ No .next cache (clean slate)"
fi

echo ""

# 5. Check server logs
echo "5️⃣  SERVER LOGS"
if [ -f server.log ]; then
    echo "   ✅ server.log exists"
    
    # Check for errors
    ERROR_COUNT=$(grep -i "error" server.log | wc -l | xargs)
    WARNING_COUNT=$(grep -i "warning" server.log | wc -l | xargs)
    TIMEOUT_COUNT=$(grep -i "timeout" server.log | wc -l | xargs)
    
    echo "   📊 Last 100 lines:"
    echo "      Errors: $ERROR_COUNT"
    echo "      Warnings: $WARNING_COUNT"
    echo "      Timeouts: $TIMEOUT_COUNT"
    
    if [ $TIMEOUT_COUNT -gt 0 ]; then
        echo ""
        echo "   ⚠️  TIMEOUT ERRORS FOUND:"
        grep -i "timeout" server.log | tail -3
    fi
else
    echo "   ℹ️  server.log not found (server not started yet)"
fi

echo ""

# 6. Check running processes
echo "6️⃣  RUNNING PROCESSES"
NODE_COUNT=$(ps aux | grep -i "node.*server.js" | grep -v grep | wc -l | xargs)
if [ $NODE_COUNT -gt 0 ]; then
    echo "   ⚠️  Server is currently running ($NODE_COUNT process)"
    echo "      Kill before restarting: killall node"
else
    echo "   ✅ No server process running"
fi

echo ""

# 7. Check git status
echo "7️⃣  GIT STATUS"
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    echo "   ⚠️  Uncommitted changes:"
    git status --short | head -10
else
    echo "   ✅ Working directory clean"
fi

echo ""
echo "=============================="
echo "📋 SUMMARY"
echo "=============================="

CRITICAL_ISSUES=0
WARNINGS=0

# Check critical issues
if [ ! -f .env.local ]; then
    echo "🚨 CRITICAL: Missing .env.local file"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
elif [[ "$DATABASE_URL" == *"[YOUR-"* ]]; then
    echo "🚨 CRITICAL: DATABASE_URL not configured"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if [ ! -d node_modules ]; then
    echo "🚨 CRITICAL: Missing node_modules"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

# Check warnings
if [[ -z "$BPOC_DATABASE_URL" ]] || [[ "$BPOC_DATABASE_URL" == *"[USER]"* ]]; then
    echo "⚠️  WARNING: BPOC database not configured (recruitment will fail)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ ! -f package-lock.json ]; then
    echo "⚠️  WARNING: package-lock.json missing"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
if [ $CRITICAL_ISSUES -eq 0 ]; then
    echo "✅ No critical issues found!"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  $WARNINGS warnings (server may have issues)"
    else
        echo "🎉 Everything looks good!"
    fi
    echo ""
    echo "🚀 Ready to start? Run:"
    echo "   npm run dev"
else
    echo "❌ Found $CRITICAL_ISSUES critical issue(s)"
    echo ""
    echo "🔧 Quick fix:"
    echo "   bash scripts/fix-server-start.sh"
fi

echo ""

