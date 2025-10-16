# Linear Task Automation Scripts

These scripts allow you to easily create Linear tasks from the command line using the API key stored in your `.env` file.

## Prerequisites

- Linear API key must be set in `.env` file (line 38): `LINEAR_API_KEY="your_key_here"`
- `jq` command-line JSON processor installed (`brew install jq`)
- `curl` (pre-installed on macOS)

## Scripts

### 1. `create-linear-task.sh`

Generic script to create any Linear task.

**Usage:**
```bash
./scripts/create-linear-task.sh "Task Title" "Task Description" [status]
```

**Parameters:**
- `Task Title` (required): The title of the Linear task
- `Task Description` (required): The description/body of the task (supports markdown)
- `status` (optional): One of `todo`, `in_progress`, `done` (default: `todo`)

**Examples:**
```bash
# Create a todo task
./scripts/create-linear-task.sh "Fix login bug" "Users cannot login on Safari"

# Create an in-progress task
./scripts/create-linear-task.sh "Build API endpoint" "Need to create /api/users endpoint" in_progress

# Create a completed task
./scripts/create-linear-task.sh "Setup database" "PostgreSQL configured and running" done
```

### 2. `post-completion-report.sh`

Automated script to post the performance review completion report as a Linear task.

**Usage:**
```bash
./scripts/post-completion-report.sh
```

This script:
- Reads `PERFORMANCE-REVIEW-COMPLETION-REPORT.md`
- Creates a Linear task with the full report as description
- Sets status to "Done" since it's a completion report
- Returns the task ID and URL

**Example output:**
```
📝 Creating Linear task...
Title: ✅ Performance Review System - Client Submission Flow Completed
Status: done
✅ Task created successfully!
ID: SHO-37
URL: https://linear.app/shoreagents/issue/SHO-37/...
```

## Configuration

The scripts automatically read from your `.env` file and use these hardcoded values:

- **Team ID:** `c5744c01-56b9-4f07-a09b-93f4f85c1ab9` (ShoreAgents)
- **Status IDs:**
  - Todo: `e7b196a9-7da8-4e9a-b4ea-663ee66d3c87`
  - In Progress: `a6801fed-42ac-42fe-884e-11f7981c81e3`
  - Done: `400ecb39-ce5a-44b6-b0d8-cb8f524f516e`

## Troubleshooting

### "LINEAR_API_KEY not found"
Make sure line 38 of your `.env` file contains:
```
LINEAR_API_KEY="lin_api_..."
```

### "jq: command not found"
Install jq:
```bash
brew install jq
```

### "Task created successfully!" but no URL
Check the Linear workspace at https://linear.app/shoreagents/

## API Reference

These scripts use the Linear GraphQL API:
- **Endpoint:** https://api.linear.app/graphql
- **Authentication:** Bearer token from `LINEAR_API_KEY`
- **Mutation:** `issueCreate`

For more information, see: https://developers.linear.app/docs/graphql/working-with-the-graphql-api

