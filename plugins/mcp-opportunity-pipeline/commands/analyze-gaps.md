---
description: Score discovered opportunities and identify gaps worth pursuing
---

# Stage 2: ANALYZE GAPS

Score opportunities from discovery and identify high-value gaps.

## Prerequisites

Requires `outputs/discover/raw-opportunities-*.json` from Stage 1.

## Parameters

Parse from user input:
- `--phase`: casual | regular | power (affects scoring weights)
- `--limit`: Max opportunities to analyze (default: 50)

## Process

Use the `gap-analyzer` agent to:

1. **Load latest discovery data** from `outputs/discover/`

2. **For each item, score on:**

   | Metric | Description | Range |
   |--------|-------------|-------|
   | sentiment | Parse reviews for complaints, frustrations | 0-10 |
   | staleness | Months since last update (>6mo = high) | 0-10 |
   | price_value | Price vs feature set and reviews | 0-10 |
   | promise_delta | Gap between description and reality | 0-10 |
   | competition | How many similar tools exist | 0-10 |
   | fit | Multi-agent benefit, not commodity CRUD | 0-10 |

3. **Calculate opportunity score:**
   ```
   opportunity_score = (
     sentiment * 0.25 +
     staleness * 0.15 +
     price_value * 0.15 +
     promise_delta * 0.20 +
     (10 - competition) * 0.10 +
     fit * 0.15
   )
   ```

4. **Apply phase weighting:**
   - **casual**: Prioritize lower competition, simpler builds
   - **regular**: Balanced approach
   - **power**: Prioritize complexity moats, premium potential

5. **Generate gap summary** and differentiation angle for each

6. **Rank and filter** top 10-20 opportunities

7. **Save** to `outputs/analyze/gap-opportunities-{date}.json`

## Output Schema

```json
{
  "analyzed_at": "2025-11-25T11:00:00Z",
  "phase": "casual",
  "opportunities": [
    {
      "name": "notion-database-sync",
      "marketplace": "apify",
      "opportunity_score": 8.2,
      "scores": {
        "sentiment": 7,
        "staleness": 9,
        "price_value": 8,
        "promise_delta": 8,
        "competition": 6,
        "fit": 7
      },
      "gap_summary": "Existing tools are slow, don't handle large DBs",
      "differentiation_angle": "Batch processing with progress tracking"
    }
  ]
}
```

## Next Step

Run `/mcp-pipeline:validate` to validate gaps against Reddit pain signals.
