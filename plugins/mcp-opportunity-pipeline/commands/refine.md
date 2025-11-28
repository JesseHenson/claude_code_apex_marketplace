---
description: Run refinement phase (draft → spec → critique → walkthrough)
---

# REFINE Phase

Iteratively develop and validate specifications through draft, critique, full spec, and walkthrough.

**Output:** Production-ready spec with validated architecture and concrete problem reproduction.

## Pipeline Position

```
IDEATE → [REFINE] → MAKE → SHIP
             │
             ├── draft       → Lightweight spec for quick validation
             ├── critique    → Architecture/scope validation
             │                 → DECISION: proceed / revise / pivot / kill
             ├── spec        → Full detailed specification
             ├── critique    → Deep spec validation
             │                 → DECISION: proceed / revise / pivot / kill
             └── walkthrough → Concrete problem reproduction
                               → DECISION: proceed / pivot / kill
```

## Prerequisites

Requires passed pre-check from IDEATE phase:
- `outputs/{name}/pre-check.md` with PROCEED decision

## Parameters

- `--name`: Opportunity name to refine (required)
- `--from`: Starting stage (default: draft)
- `--skip-walkthrough`: Skip interactive walkthrough (default: false)

## Stages Executed

### 1. DRAFT
Create lightweight spec (30-60 min):
- Problem statement
- Core features (bullets)
- Technical approach
- Monetization model
- Output: `outputs/{name}/draft.md`

### 2. CRITIQUE (Draft)
Validate draft viability:
- Problem-solution fit
- Feature scope sanity
- Technical approach assessment
- Output: Updates `outputs/{name}/critique.md`
- Decision: PROCEED | REVISE | PIVOT | KILL

### 3. SPEC
Full detailed specification:
- Acceptance criteria
- Tool definitions
- Architecture details
- Error handling
- Output: `outputs/{name}/spec.md`

### 4. CRITIQUE (Spec)
Deep spec validation:
- API feasibility
- Architecture stress test
- Hidden complexity audit
- Promise vs reality check
- Output: Updates `outputs/{name}/critique.md`
- Decision: PROCEED | REVISE | PIVOT | KILL

### 5. WALKTHROUGH
Interactive problem reproduction:
- Set up existing tools
- Reproduce the pain point
- Document before/after
- Output: `outputs/{name}/walkthrough.md`
- Decision: PROCEED | PIVOT | KILL

## Decision Points

Each critique/walkthrough produces a decision:

| Decision | Meaning | Action |
|----------|---------|--------|
| **PROCEED** | Validated, continue | Move to next stage |
| **REVISE** | Fixable issues | Update and re-critique |
| **PIVOT** | Fundamental issue | Run pivot analysis |
| **KILL** | Not viable | Abandon this opportunity |

## Iteration Loops

### Revise Loop (Common)
```
draft → critique(draft) → REVISE
                ↓
        update draft → re-critique
                ↓
             PROCEED → spec
```

### Pivot Loop (Less Common)
```
spec → critique(spec) → PIVOT
              ↓
    pivot analysis skill
              ↓
    new approach identified
              ↓
    draft (new approach) → continue
```

## Output Summary

After refine completes:

```
outputs/{name}/
├── pre-check.md    (from IDEATE)
├── draft.md        (lightweight spec)
├── spec.md         (full specification)
├── critique.md     (validation results)
├── walkthrough.md  (problem reproduction)
└── decisions.json  (decision log)
```

## Decision Log

`outputs/{name}/decisions.json`:

```json
{
  "opportunity": "notion-database-sync-mcp",
  "decisions": [
    {
      "stage": "pre-check",
      "date": "2025-11-28T10:00:00Z",
      "decision": "proceed",
      "notes": "APIs available, legal OK"
    },
    {
      "stage": "critique-draft",
      "date": "2025-11-28T11:00:00Z",
      "decision": "revise",
      "notes": "Feature scope too broad, reduce MVP"
    },
    {
      "stage": "critique-draft",
      "date": "2025-11-28T11:30:00Z",
      "decision": "proceed",
      "notes": "Scope reduced, approach validated"
    },
    {
      "stage": "critique-spec",
      "date": "2025-11-28T13:00:00Z",
      "decision": "proceed",
      "notes": "Architecture sound, minor warnings noted"
    },
    {
      "stage": "walkthrough",
      "date": "2025-11-28T14:00:00Z",
      "decision": "proceed",
      "notes": "Problem reproduced, solution validated"
    }
  ],
  "final_status": "ready_for_build",
  "total_revisions": 1,
  "pivots": 0
}
```

## Usage

### Full refine run
```
/mcp-opportunity-pipeline:refine --name notion-database-sync-mcp
```

### Start from specific stage
```
/mcp-opportunity-pipeline:refine --name notion-database-sync-mcp --from spec
```

### Skip walkthrough (non-interactive)
```
/mcp-opportunity-pipeline:refine --name notion-database-sync-mcp --skip-walkthrough
```

### Individual stages
```
/mcp-opportunity-pipeline:draft --name notion-database-sync-mcp
/mcp-opportunity-pipeline:critique --name notion-database-sync-mcp --stage draft
/mcp-opportunity-pipeline:spec --name notion-database-sync-mcp
/mcp-opportunity-pipeline:critique --name notion-database-sync-mcp --stage spec
/mcp-opportunity-pipeline:walkthrough --name notion-database-sync-mcp
```

## Handling Pivots

When a decision is PIVOT:

1. Run pivot analysis skill:
```
Use skill: mcp-opportunity-pipeline:pivot-analysis

Opportunity: {name}
Stage: {where pivot occurred}
Reason: {from critique/walkthrough}
```

2. Skill provides:
   - Pivot type options (new_idea, new_approach, new_scope)
   - Effort comparison for each path
   - Risk assessment
   - Recommended action

3. Execute pivot:
```
/mcp-opportunity-pipeline:pivot --name {name} --type {type} --reason "..."
```

4. Resume from appropriate stage

## Next Phase

After walkthrough PROCEED:
```
/mcp-opportunity-pipeline:make --name {opportunity-name}
```
