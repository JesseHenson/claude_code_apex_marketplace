---
description: Walkthrough the user experience of a problem/feature before or after spec generation
---

# WALKTHROUGH

Interactively explore and document the actual user experience of a problem or feature. This helps validate specs against reality.

## Purpose

Before building, you should understand:
1. **How the current tool works** - Set it up, use it, hit the pain points
2. **What the user actually experiences** - Step-by-step reproduction
3. **Where existing solutions fall short** - Concrete gaps, not assumptions

## Parameters

- `--spec`: Spec name to walkthrough (e.g., `airtable-advanced-mcp`)
- `--feature`: Specific feature to explore (e.g., `linked-records`)
- `--tool`: External tool to set up and test (e.g., `smithery-airtable-mcp`)

## Process

### 1. Tool Setup
Guide user through setting up the existing tool/MCP:
- Installation steps
- Authentication
- Basic configuration
- Verify it works

### 2. Feature Exploration
Walk through the specific feature:
- How to create/use it in the native tool (e.g., Airtable)
- What the expected behavior is
- Screenshots or concrete examples

### 3. Pain Point Reproduction
Reproduce the actual problem:
- Step-by-step to hit the limitation
- What error/frustration occurs
- How users currently work around it

### 4. Gap Documentation
Document the gap for the spec:
- Current behavior vs expected behavior
- Concrete example with real data
- What our solution should do differently

## Output

Adds a `## Walkthrough` section to the spec with:
- Setup instructions for testing
- Step-by-step reproduction of the problem
- Concrete examples with sample data
- Before/after comparison

## Usage Examples

### Walkthrough a specific spec
```
/mcp-opportunity-pipeline:walkthrough --spec airtable-advanced-mcp --feature linked-records
```

### Walkthrough before spec generation
```
/mcp-opportunity-pipeline:walkthrough --tool smithery-airtable-mcp
```

### General exploration
```
/mcp-opportunity-pipeline:walkthrough --spec notion-database-sync-mcp
```

## Interactive Mode

When run, the agent will:

1. **Ask clarifying questions:**
   - "Which feature do you want to explore?"
   - "Do you have an Airtable/Notion account to test with?"
   - "Should I set up a test base/database?"

2. **Guide setup:**
   - Provide exact commands/steps
   - Wait for user confirmation at each step
   - Help troubleshoot issues

3. **Document findings:**
   - Capture what works
   - Capture what breaks
   - Update spec with concrete examples

## Why This Matters

Specs based on assumptions fail. Specs based on reproduced pain points succeed.

**Before:** "Users complain about linked records"
**After:** "When you query a Projects table with a linked Clients field, the MCP returns `['rec123', 'rec456']` instead of the actual client names. You have to make N additional API calls to resolve them."
