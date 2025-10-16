#!/bin/bash

# Linear Task Creation Script
# Usage: ./scripts/create-linear-task.sh "Task Title" "Task Description" [status]
# Status options: todo, in_progress, done (default: todo)

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep 'LINEAR_API_KEY' | xargs)
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Linear Configuration (from API query)
TEAM_ID="c5744c01-56b9-4f07-a09b-93f4f85c1ab9"  # ShoreAgents team
STATE_TODO="e7b196a9-7da8-4e9a-b4ea-663ee66d3c87"
STATE_IN_PROGRESS="a6801fed-42ac-42fe-884e-11f7981c81e3"
STATE_DONE="400ecb39-ce5a-44b6-b0d8-cb8f524f516e"

# Check if API key is set
if [ -z "$LINEAR_API_KEY" ]; then
    echo "❌ Error: LINEAR_API_KEY not found in .env file"
    echo "Make sure line 38 of .env contains: LINEAR_API_KEY=\"your_key_here\""
    exit 1
fi

# Parse arguments
TITLE="$1"
DESCRIPTION="$2"
STATUS="${3:-todo}"

# Validate arguments
if [ -z "$TITLE" ]; then
    echo "❌ Error: Task title is required"
    echo "Usage: ./scripts/create-linear-task.sh \"Task Title\" \"Task Description\" [status]"
    exit 1
fi

# Set state ID based on status
case $STATUS in
    "todo")
        STATE_ID=$STATE_TODO
        ;;
    "in_progress")
        STATE_ID=$STATE_IN_PROGRESS
        ;;
    "done")
        STATE_ID=$STATE_DONE
        ;;
    *)
        echo "❌ Error: Invalid status '$STATUS'"
        echo "Valid options: todo, in_progress, done"
        exit 1
        ;;
esac

# Escape description for JSON (handle quotes, newlines, and control characters)
DESCRIPTION_ESCAPED=$(echo "$DESCRIPTION" | jq -Rs .)

# Create Linear task
echo "📝 Creating Linear task..."
echo "Title: $TITLE"
echo "Status: $STATUS"

RESPONSE=$(curl -s -X POST https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation CreateIssue(\$input: IssueCreateInput!) { issueCreate(input: \$input) { success issue { id identifier title url } } }\",
    \"variables\": {
      \"input\": {
        \"teamId\": \"$TEAM_ID\",
        \"title\": \"$TITLE\",
        \"description\": $DESCRIPTION_ESCAPED,
        \"stateId\": \"$STATE_ID\"
      }
    }
  }")

# Check for errors
if echo "$RESPONSE" | grep -q "\"errors\""; then
    echo "❌ Error creating task:"
    echo "$RESPONSE" | jq -r '.errors[0].message' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Parse success response
SUCCESS=$(echo "$RESPONSE" | jq -r '.data.issueCreate.success' 2>/dev/null)

if [ "$SUCCESS" = "true" ]; then
    TASK_ID=$(echo "$RESPONSE" | jq -r '.data.issueCreate.issue.identifier')
    TASK_URL=$(echo "$RESPONSE" | jq -r '.data.issueCreate.issue.url')
    
    echo "✅ Task created successfully!"
    echo "ID: $TASK_ID"
    echo "URL: $TASK_URL"
else
    echo "❌ Failed to create task"
    echo "$RESPONSE"
    exit 1
fi

