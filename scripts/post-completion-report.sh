#!/bin/bash

# Post Performance Review Completion Report to Linear
# This script reads the completion report and creates a Linear task

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Path to completion report
REPORT_FILE="$PROJECT_DIR/PERFORMANCE-REVIEW-COMPLETION-REPORT.md"

# Check if report exists
if [ ! -f "$REPORT_FILE" ]; then
    echo "❌ Error: Completion report not found at $REPORT_FILE"
    exit 1
fi

# Read the report content
REPORT_CONTENT=$(cat "$REPORT_FILE")

# Task details
TITLE="✅ Performance Review System - Client Submission Flow Completed"
STATUS="done"  # Set to "done" since work is completed

# Create the Linear task
"$SCRIPT_DIR/create-linear-task.sh" "$TITLE" "$REPORT_CONTENT" "$STATUS"

