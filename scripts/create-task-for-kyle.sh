#!/bin/bash

# Create Linear Task for Kyle
# This script creates a Linear task and assigns it to Kyle with "In Progress" status

echo "🚀 Creating Linear task for Kyle..."
echo ""

# You need to set these values:
# Get your Team ID from Linear: Settings > Teams > Copy ID
# Get Kyle's User ID from Linear: Settings > Members > Copy Kyle's ID

TEAM_ID="your-team-id-here"
KYLE_USER_ID="your-kyle-user-id-here"

# Check if IDs are set
if [ "$TEAM_ID" = "your-team-id-here" ] || [ "$KYLE_USER_ID" = "your-kyle-user-id-here" ]; then
    echo "❌ ERROR: Please edit this script and set TEAM_ID and KYLE_USER_ID"
    echo ""
    echo "To find these:"
    echo "1. Go to Linear: https://linear.app"
    echo "2. Team ID: Settings > Teams > Copy ID"
    echo "3. Kyle's User ID: Settings > Members > Find Kyle > Copy ID"
    echo ""
    exit 1
fi

# Run the script
node scripts/create-linear-task.js \
    LINEAR-TASK-CLIENT-TICKETING-COMPLETE.md \
    "$TEAM_ID" \
    "$KYLE_USER_ID" \
    "In Progress"

echo ""
echo "✅ Done! Check Linear to see the new task assigned to Kyle!"

