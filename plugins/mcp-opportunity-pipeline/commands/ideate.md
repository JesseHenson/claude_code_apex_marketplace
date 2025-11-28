---
description: Run ideation phase (discover → analyze-gaps → validate → pre-check)
---

# IDEATE Phase

Run the ideation pipeline: discover opportunities, analyze gaps, validate demand, and pre-check feasibility.

**Output:** Validated opportunities with feasibility assessment, ready for REFINE phase.

## Pipeline Position

```
[IDEATE] → REFINE → MAKE → SHIP
    │
    ├── discover      → Raw opportunities from marketplaces
    ├── analyze-gaps  → Scored and ranked
    ├── validate      → Reddit/web pain signal confirmation
    └── pre-check     → Feasibility critique (APIs, legal, costs)
                        → DECISION: proceed / pivot / kill
```

## Parameters

- `--phase`: casual | regular | power (default: casual)
- `--marketplaces`: Comma-separated list (default: apify,smithery,mcp_registry)
- `--days`: Reddit validation lookback (default: 14)
- `--select`: How many to pre-check (default: top-3)

## Stages Executed

### 1. DISCOVER
Scrape marketplaces for opportunities.
- Output: `outputs/discover/raw-opportunities-{date}.json`

### 2. ANALYZE-GAPS
Score opportunities on sentiment, staleness, competition, fit.
- Output: `outputs/analyze/gap-opportunities-{date}.json`

### 3. VALIDATE
Check Reddit/web for real pain signals.
- Output: `outputs/validate/validated-opportunities-{date}.json`

### 4. PRE-CHECK
Feasibility critique for top opportunities:
- API availability and costs
- Legal/TOS issues
- Platform viability
- Competitive moat

For each opportunity, produces:
- Output: `outputs/{name}/pre-check.md`
- Decision: PROCEED | PIVOT | KILL

## Decision Points

After PRE-CHECK, each opportunity gets a decision:

| Decision | Meaning | Next Action |
|----------|---------|-------------|
| **PROCEED** | Feasibility confirmed | Move to REFINE phase |
| **PIVOT** | Blocker found, but alternatives exist | Run pivot analysis |
| **KILL** | Not viable | Skip, move to next opportunity |

## Output Summary

After ideate completes:

```
outputs/
├── discover/raw-opportunities-{date}.json
├── analyze/gap-opportunities-{date}.json
├── validate/validated-opportunities-{date}.json
├── {opportunity-1}/
│   └── pre-check.md  (PROCEED)
├── {opportunity-2}/
│   └── pre-check.md  (PIVOT - needs new approach)
├── {opportunity-3}/
│   └── pre-check.md  (KILL - API dead)
└── ideate-run-{date}.json
```

## Run Summary File

`outputs/ideate-run-{date}.json`:

```json
{
  "run_at": "2025-11-28T...",
  "phase": "casual",
  "stages_completed": ["discover", "analyze", "validate", "pre-check"],
  "opportunities_discovered": 38,
  "opportunities_validated": 10,
  "pre_check_results": {
    "proceed": ["notion-database-sync-mcp"],
    "pivot": ["linkedin-enrichment-mcp"],
    "kill": []
  },
  "next_steps": [
    {
      "opportunity": "notion-database-sync-mcp",
      "action": "refine",
      "command": "/mcp-opportunity-pipeline:refine --name notion-database-sync-mcp"
    },
    {
      "opportunity": "linkedin-enrichment-mcp",
      "action": "pivot",
      "command": "/mcp-opportunity-pipeline:pivot --name linkedin-enrichment-mcp"
    }
  ]
}
```

## Usage

### Full ideate run
```
/mcp-opportunity-pipeline:ideate
```

### Custom parameters
```
/mcp-opportunity-pipeline:ideate --phase regular --select top-5
```

### Resume from specific stage
```
/mcp-opportunity-pipeline:pre-check --all
```

## Next Phase

For opportunities with PROCEED decision:
```
/mcp-opportunity-pipeline:refine --name {opportunity-name}
```

For opportunities with PIVOT decision:
```
/mcp-opportunity-pipeline:pivot --name {opportunity-name}
```
