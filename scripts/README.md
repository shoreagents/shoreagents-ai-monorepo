# Linear Task Creation Scripts

These scripts help you create Linear tasks automatically from markdown documentation files.

## Setup

### 1. Install Dependencies

Make sure you have `dotenv` installed:

```bash
npm install dotenv
```

### 2. Add Linear API Key to `.env`

Add this line to your `.env` file (should already be on line 38):

```env
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**To get your Linear API Key:**
1. Go to https://linear.app
2. Click your profile (bottom left)
3. Settings > API > Personal API Keys
4. Create a new key
5. Copy and paste it into `.env`

### 3. Get Team ID and User IDs

**Team ID:**
1. Go to Linear > Settings > Teams
2. Click your team
3. Copy the Team ID (looks like: `TEAM-xxxxx`)

**Kyle's User ID:**
1. Go to Linear > Settings > Members
2. Find Kyle in the list
3. Click on Kyle
4. Copy his User ID (looks like: `USER-xxxxx`)

## Usage

### Method 1: Quick Script (Easiest)

1. Edit `scripts/create-task-for-kyle.sh` and add your IDs:

```bash
TEAM_ID="TEAM-xxxxx"      # Your team ID
KYLE_USER_ID="USER-xxxxx"  # Kyle's user ID
```

2. Make it executable:

```bash
chmod +x scripts/create-task-for-kyle.sh
```

3. Run it:

```bash
./scripts/create-task-for-kyle.sh
```

### Method 2: Direct Script (More Flexible)

```bash
node scripts/create-linear-task.js \
    <markdown-file> \
    <team-id> \
    <assignee-id> \
    [status]
```

**Example:**

```bash
node scripts/create-linear-task.js \
    LINEAR-TASK-CLIENT-TICKETING-COMPLETE.md \
    TEAM-12345 \
    USER-67890 \
    "In Progress"
```

## What It Does

The script will:
1. ✅ Read your markdown documentation file
2. ✅ Extract the title (first # heading)
3. ✅ Use the full markdown as the task description
4. ✅ Create a Linear task in your team
5. ✅ Assign it to Kyle (or whoever you specify)
6. ✅ Set status to "In Progress" (or your choice)
7. ✅ Set priority to High
8. ✅ Return the task URL

## Example Output

```
🚀 Creating Linear task...
📝 Title: Client Ticketing System - Complete Implementation
👤 Assignee ID: USER-67890
📋 Team ID: TEAM-12345

✅ Linear task created successfully!

📌 ID: PROJ-123
📝 Title: Client Ticketing System - Complete Implementation
🔗 URL: https://linear.app/your-team/issue/PROJ-123

✨ Task is ready in Linear!
```

## For Future Tasks

You can reuse `create-linear-task.js` for any future tasks:

1. Write your documentation in a markdown file
2. Run the script with your markdown file
3. Task created in Linear!

**Example for a different task:**

```bash
node scripts/create-linear-task.js \
    MY-NEW-FEATURE.md \
    TEAM-12345 \
    USER-different-person \
    "Todo"
```

## Troubleshooting

### Error: LINEAR_API_KEY not found
- Check your `.env` file has `LINEAR_API_KEY=...`
- Make sure the key starts with `lin_api_`

### Error: File not found
- Make sure your markdown file exists in the project root
- Use the correct filename with extension (.md)

### Error: Invalid team or assignee
- Double-check your Team ID and User ID in Linear
- Make sure they're the correct format (TEAM-xxxxx, USER-xxxxx)

## Files

- `create-linear-task.js` - Main reusable script
- `create-task-for-kyle.sh` - Quick helper for Kyle
- `README.md` - This file

## Need Help?

Check the Linear API docs: https://developers.linear.app/docs/graphql/working-with-the-graphql-api
