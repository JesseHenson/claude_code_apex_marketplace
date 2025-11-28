---
description: Show current pipeline status, decisions, and next steps
---

# STATUS

Display current state of the pipeline, all opportunities, their decisions, and recommended next actions.

## Usage

### Full pipeline status
```
/mcp-opportunity-pipeline:status
```

### Specific opportunity status
```
/mcp-opportunity-pipeline:status --name notion-database-sync-mcp
```

## Output: Full Pipeline Status

```markdown
# MCP Opportunity Pipeline Status

## Pipeline Overview

| Phase | Status | Last Run |
|-------|--------|----------|
| IDEATE | ✅ Complete | 2025-11-28 |
| REFINE | 🔄 In Progress | 2025-11-28 |
| MAKE | ⏳ Pending | - |
| SHIP | ⏳ Pending | - |

## Opportunities

| Name | Stage | Decision | Next Action |
|------|-------|----------|-------------|
| notion-database-sync-mcp | walkthrough | PROCEED | `/make --name notion...` |
| airtable-advanced-mcp | critique-spec | REVISE | Update spec, re-critique |
| linkedin-enrichment-mcp | pre-check | KILL | Archived |

## Decision Summary

- **Proceeded:** 2
- **Pivoted:** 0
- **Killed:** 1
- **Revisions:** 3

## Recommended Next Actions

1. **notion-database-sync-mcp** - Ready for MAKE phase
   ```
   /mcp-opportunity-pipeline:make --name notion-database-sync-mcp
   ```

2. **airtable-advanced-mcp** - Needs spec revision
   - Issue: Formula introspection not possible
   - Action: Remove feature, re-run critique
```

## Output: Specific Opportunity Status

```markdown
# Status: notion-database-sync-mcp

## Current Stage
**REFINE** → walkthrough (complete)

## Progress

| Stage | Status | Date | Decision |
|-------|--------|------|----------|
| pre-check | ✅ | 2025-11-28 10:00 | PROCEED |
| draft | ✅ | 2025-11-28 10:30 | - |
| critique (draft) | ✅ | 2025-11-28 11:00 | PROCEED |
| spec | ✅ | 2025-11-28 12:00 | - |
| critique (spec) | ✅ | 2025-11-28 13:00 | PROCEED (with notes) |
| walkthrough | ✅ | 2025-11-28 14:00 | PROCEED |

## Decision Log

1. **pre-check** (PROCEED)
   - APIs: Notion API free ✓
   - Legal: Official API ✓
   - Note: OAuth needs approval

2. **critique-draft** (PROCEED)
   - Scope validated
   - Features appropriate for MVP

3. **critique-spec** (PROCEED with notes)
   - Warning: Progress tracking may not work in MCP
   - Warning: Need Stripe for billing
   - Decision: Proceed, document limitations

4. **walkthrough** (PROCEED)
   - Problem reproduced
   - Rate limit pain is real
   - Solution approach validated

## Files

- `outputs/notion-database-sync-mcp/pre-check.md` ✓
- `outputs/notion-database-sync-mcp/draft.md` ✓
- `outputs/notion-database-sync-mcp/spec.md` ✓
- `outputs/notion-database-sync-mcp/critique.md` ✓
- `outputs/notion-database-sync-mcp/walkthrough.md` ✓
- `outputs/notion-database-sync-mcp/decisions.json` ✓

## Known Issues / Warnings

1. Progress tracking may not work as spec'd in MCP
2. Smithery has no PPE billing - need Stripe
3. OAuth requires Notion security review

## Next Action

Ready for MAKE phase:
```
/mcp-opportunity-pipeline:make --name notion-database-sync-mcp
```

## Pivot History

No pivots for this opportunity.
```

## Data Sources

Reads from:
- `outputs/*/decisions.json` - Decision logs
- `outputs/*/pre-check.md` - Feasibility status
- `outputs/*/critique.md` - Critique status
- `outputs/ideate-run-*.json` - Ideate summaries
- `outputs/pipeline-stats.json` - Overall stats

## Integration

Use status to:
1. See what's ready for next phase
2. Track revision/pivot history
3. Identify blocked opportunities
4. Get recommended next commands
