---
description: Record and execute a pivot decision - change approach, scope, or idea
---

# PIVOT

Record a pivot decision and determine the best path forward when an opportunity needs to change direction.

## When to Pivot

A pivot is triggered when:
- Pre-check finds a blocker (API dead, legal issue)
- Critique reveals fundamental flaws
- Walkthrough shows problem is different than expected
- Scope is too large for current phase

## Pivot Types

| Type | When to Use | What Changes |
|------|-------------|--------------|
| `new_idea` | Fundamental blocker, can't build this at all | Start fresh with different opportunity |
| `new_approach` | Same problem, but need different solution | Keep problem, change technical approach |
| `new_scope` | Too complex, need to reduce | Same idea, smaller MVP |

## Parameters

- `--name`: Opportunity name (required)
- `--type`: new_idea | new_approach | new_scope (required)
- `--reason`: Brief explanation of why pivoting (required)

## Process

### 1. Record the Pivot Decision

Log to `outputs/{name}/decisions.json`:

```json
{
  "stage": "pivot",
  "date": "2025-11-28T...",
  "decision": "pivot",
  "pivot_type": "new_approach",
  "reason": "Proxycurl shut down, need different data source",
  "from_stage": "pre-check"
}
```

### 2. Invoke Pivot Analysis Skill

Automatically triggers the `pivot-analysis` skill to evaluate options:

```
Analyzing pivot for: {name}
Pivot type: {type}
Reason: {reason}
Current stage: {stage}
```

### 3. Get Recommendations

The skill provides:
- Alternative approaches (for new_approach)
- Scope reduction options (for new_scope)
- Next best opportunities (for new_idea)
- Effort comparison
- Risk assessment
- Recommended path

### 4. Execute the Pivot

Based on pivot type:

#### new_idea
```
1. Archive current opportunity folder
2. Select next opportunity from validated list
3. Resume from pre-check with new opportunity
```

#### new_approach
```
1. Document what's changing
2. Return to draft stage with new approach
3. Re-run refine phase
```

#### new_scope
```
1. Document scope reduction
2. Update draft with reduced features
3. Re-run critique
```

## Output

Updates `outputs/{name}/decisions.json` with pivot record.

Creates `outputs/{name}/pivot-{date}.md`:

```markdown
# Pivot: {name}

## Decision
- **Type:** {new_idea | new_approach | new_scope}
- **Date:** {date}
- **Stage:** {where pivot occurred}
- **Reason:** {explanation}

## Analysis

### What Blocked Us
{description of the blocker}

### Options Considered
1. **Option A:** ...
   - Effort: ...
   - Risk: ...
2. **Option B:** ...
   - Effort: ...
   - Risk: ...

### Recommended Path
{which option and why}

## Action Taken
- {what we're doing next}
- {command to run}

## Lessons Learned
- {what to check earlier next time}
```

## Usage

### Pivot due to API blocker
```
/mcp-opportunity-pipeline:pivot --name linkedin-enrichment-mcp --type new_idea --reason "Proxycurl shut down, no viable alternative at our price point"
```

### Pivot to different technical approach
```
/mcp-opportunity-pipeline:pivot --name airtable-advanced-mcp --type new_approach --reason "Linked record expansion too complex, try formula-based workaround instead"
```

### Pivot to smaller scope
```
/mcp-opportunity-pipeline:pivot --name notion-database-sync-mcp --type new_scope --reason "Progress tracking too complex for MCP, remove from MVP"
```

## Integration with Skill

The pivot command automatically invokes the `pivot-analysis` skill:

```
Skill: mcp-opportunity-pipeline:pivot-analysis

Context provided:
- Opportunity details
- All critique findings
- Pre-check results
- Current stage
- Pivot reason

Skill returns:
- Weighted analysis of options
- Effort estimates
- Risk factors
- Clear recommendation
```

## After Pivot

### For new_idea
```
/mcp-opportunity-pipeline:ideate  # Pick next opportunity
# OR
/mcp-opportunity-pipeline:refine --name {next-opportunity}
```

### For new_approach
```
/mcp-opportunity-pipeline:draft --name {name}  # Re-draft with new approach
```

### For new_scope
```
/mcp-opportunity-pipeline:draft --name {name}  # Update draft with reduced scope
```

## Pivot Tracking

The pipeline tracks pivots across opportunities:

`outputs/pipeline-stats.json`:
```json
{
  "total_opportunities": 10,
  "proceeded": 3,
  "pivoted": 4,
  "killed": 3,
  "pivots_by_type": {
    "new_idea": 1,
    "new_approach": 2,
    "new_scope": 1
  },
  "common_pivot_reasons": [
    "API costs too high",
    "Scope too large",
    "Legal concerns"
  ]
}
```
