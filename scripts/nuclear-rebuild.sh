#!/bin/bash

# 💣 NUCLEAR REBUILD SCRIPT
# This completely wipes and rebuilds your entire project from scratch
# Use this when everything is corrupted and hanging

echo "💣 NUCLEAR REBUILD - COMPLETE PROJECT RESET"
echo "==========================================="
echo ""
echo "⚠️  WARNING: This will delete and rebuild everything!"
echo "✅ Your .env.local and source code will be preserved"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🔥 STEP 1: Kill ALL Node processes"
echo "-----------------------------------"
killall node 2>/dev/null || true
sleep 2
echo "✅ All Node processes killed"

echo ""
echo "🔥 STEP 2: Delete ALL caches and build artifacts"
echo "-----------------------------------"
rm -rf .next
rm -rf node_modules
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf out
rm -rf build
rm -rf dist
rm -rf .parcel-cache
rm -rf coverage
rm -rf .nyc_output
rm -rf prisma/migrations/.migration_lock
echo "✅ All caches deleted"

echo ""
echo "🔥 STEP 3: Delete lock files (will regenerate)"
echo "-----------------------------------"
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml
echo "✅ Lock files deleted"

echo ""
echo "🔥 STEP 4: Clean npm cache"
echo "-----------------------------------"
npm cache clean --force
echo "✅ npm cache cleaned"

echo ""
echo "📦 STEP 5: Fresh install of ALL dependencies"
echo "-----------------------------------"
echo "⏳ This may take 2-3 minutes..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"

echo ""
echo "🔄 STEP 6: Generate Prisma Client"
echo "-----------------------------------"
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed"
    echo "🔧 Trying to fix Prisma schema..."
    npx prisma format
    npx prisma generate
    if [ $? -ne 0 ]; then
        echo "❌ Still failed - check your prisma/schema.prisma file"
        exit 1
    fi
fi
echo "✅ Prisma client generated"

echo ""
echo "🔍 STEP 7: Verify database connection"
echo "-----------------------------------"
# Just test the connection without pulling schema
npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database connection verified"
else
    echo "⚠️  Could not verify database connection (may still work)"
fi

echo ""
echo "🧹 STEP 8: Final cleanup"
echo "-----------------------------------"
# Remove any orphaned processes
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "webpack" 2>/dev/null || true
echo "✅ Cleanup complete"

echo ""
echo "=========================================="
echo "🎉 NUCLEAR REBUILD COMPLETE!"
echo "=========================================="
echo ""
echo "📊 Status Check:"
echo "  ✅ All caches cleared"
echo "  ✅ Fresh node_modules installed"
echo "  ✅ Prisma client generated"
echo "  ✅ No hanging processes"
echo ""
echo "🚀 Ready to start fresh!"
echo ""
echo "Next steps:"
echo "  1. npm run dev      (Start development server)"
echo "  2. Test login at http://localhost:3000"
echo "  3. Check recruitment features"
echo ""
echo "💡 If issues persist, check:"
echo "  - .env.local has correct database URLs"
echo "  - BPOC_DATABASE_URL is reachable"
echo "  - No firewall blocking database connections"
echo ""

