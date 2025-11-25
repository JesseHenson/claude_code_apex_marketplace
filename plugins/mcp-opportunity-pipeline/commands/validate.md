---
description: Validate gaps against real user pain signals from Reddit and forums
---

# Stage 3: VALIDATE

Validate gap opportunities against real user pain in Reddit/forums (last 7-14 days).

## Prerequisites

Requires `outputs/analyze/gap-opportunities-*.json` from Stage 2.

## Parameters

Parse from user input:
- `--days`: Days to look back (default: 14)
- `--limit`: Max opportunities to validate (default: 20)
- `--subreddits`: Override default subreddits (optional)

## Process

Use the `reddit-validator` agent to:

1. **Load latest gap analysis** from `outputs/analyze/`

2. **For each opportunity (top 10-20):**

   a. **Generate search queries** from gap summary and tool category

   b. **Search target subreddits:**
      - r/SideProject, r/EntrepreneurRideAlong, r/nocode
      - r/AutomateYourself, r/ClaudeAI, r/ChatGPT
      - r/webdev, r/developers, r/SaaS, r/smallbusiness
      - Tool-specific subs if applicable

   c. **Look for pain signals:**
      - Complaints, frustrations, workarounds
      - "wish there was...", "looking for..."
      - "currently paying $X for...", "would pay for..."

   d. **Score each mention:**

      | Metric | Weight | Description |
      |--------|--------|-------------|
      | frequency | 0.30 | How many posts mention this pain |
      | intensity | 0.25 | How frustrated are users |
      | willingness_to_pay | 0.30 | Budget mentions, pricing signals |
      | recency | 0.15 | Recent posts weighted higher |

3. **Calculate validation score:**
   ```
   validation_score = (
     frequency * 0.30 +
     intensity * 0.25 +
     willingness_to_pay * 0.30 +
     recency * 0.15
   )
   ```

4. **Filter:** Only pass opportunities with validation_score > 6.0

5. **Attach evidence** (links, quotes) to each validated opportunity

6. **Save** to `outputs/validate/validated-opportunities-{date}.json`

## Output Schema

```json
{
  "validated_at": "2025-11-25T12:00:00Z",
  "validated_opportunities": [
    {
      "name": "notion-database-sync",
      "opportunity_score": 8.2,
      "validation_score": 7.5,
      "evidence": [
        {
          "source": "r/NotionSo",
          "url": "https://reddit.com/...",
          "snippet": "I've tried 3 different sync tools...",
          "intensity": "high",
          "date": "2025-11-22"
        }
      ],
      "pain_summary": "Users frustrated with performance on large databases"
    }
  ]
}
```

## Next Step

Run `/mcp-pipeline:spec` to generate buildable specs for top opportunities.
