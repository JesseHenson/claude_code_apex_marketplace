---
description: Critical analysis of draft or full spec - validates architecture and identifies hidden complexity
---

# Stage: CRITIQUE (Spec Critique)

Deep critical analysis of a draft or full spec to identify architectural flaws, hidden complexity, and implementation risks.

**This is different from PRE-CHECK:**
- PRE-CHECK: Can we build this at all? (APIs, legal, costs)
- CRITIQUE: Is this spec well-designed? (architecture, complexity, scope)

## Purpose

Find issues that would only surface "6 feet into development":
- Architectural flaws
- Underestimated complexity
- Missing edge cases
- Unrealistic promises
- Scope creep indicators

## Prerequisites

- For draft critique: `outputs/{name}/draft.md`
- For spec critique: `outputs/{name}/spec.md`

## Parameters

- `--name`: Project name to critique
- `--stage`: `draft` or `spec` (default: auto-detect)

## Process

### For Draft Critique

Focus on high-level viability:

#### 1. Problem-Solution Fit
```
□ Does the solution actually solve the stated problem?
□ Is the problem real or assumed?
□ Are there simpler solutions we're missing?
```

#### 2. Feature Scope
```
□ Are features truly MVP or scope creep?
□ Can each feature be built in days, not weeks?
□ Are there hidden dependencies between features?
```

#### 3. Technical Approach
```
□ Is the architecture appropriate for the problem?
□ Are there obvious alternatives not considered?
□ What's the complexity we're not seeing?
```

#### 4. Monetization Reality
```
□ Will users pay this for this value?
□ Do the unit economics work?
□ Is the pricing competitive?
```

### For Spec Critique (Full Analysis)

Everything from draft critique PLUS:

#### 5. API/Integration Deep Dive
```
□ For each API call in spec:
  - What's the actual response format?
  - What errors can occur?
  - What are the edge cases?
□ Do the tools match what the API can do?
□ Are there API limitations not acknowledged?
```

#### 6. Architecture Stress Test
```
□ What happens at 10x scale?
□ What happens with bad input?
□ What happens when dependencies fail?
□ State management: is "stateless" actually stateless?
```

#### 7. Feature Feasibility
```
□ For each feature:
  - Is this actually possible with the stated approach?
  - What complexity is hidden in "just do X"?
  - What's the real implementation effort?
□ Are there features that contradict each other?
```

#### 8. Promise vs Reality
```
□ What does the spec promise that we can't deliver?
□ What UX expectations are unrealistic?
□ Where are we hand-waving complexity?
```

## Output

Saves to `outputs/{name}/critique.md`:

```markdown
# Critique: {name}

## Critique Type: {draft | spec}
## Date: {date}

## Risk Summary

| Category | Risk Level | Key Concern |
|----------|------------|-------------|
| Problem-Solution Fit | 🟢/🟡/🔴 | ... |
| Feature Scope | 🟢/🟡/🔴 | ... |
| Technical Approach | 🟢/🟡/🔴 | ... |
| API Feasibility | 🟢/🟡/🔴 | ... |
| Hidden Complexity | 🟢/🟡/🔴 | ... |
| Monetization | 🟢/🟡/🔴 | ... |

## Decision

[ ] **PROCEED** - Spec is solid, move to next stage
[ ] **REVISE** - Issues found, update spec and re-critique
[ ] **PIVOT** - Fundamental issues, need different approach
[ ] **KILL** - Spec reveals this isn't viable

## Critical Issues (Must Address)

### Issue 1: {title}
- **What:** Description of the issue
- **Why it matters:** Impact if not addressed
- **Recommendation:** How to fix

### Issue 2: ...

## Warnings (Should Address)

### Warning 1: {title}
- **What:** Description
- **Risk level:** Low/Medium
- **Recommendation:** Suggested action

## Spec Corrections Needed

| Section | Current | Should Be |
|---------|---------|-----------|
| Feature X | "Auto-resolve linked records" | "Resolve linked records (1 level, 2-3 API calls)" |
| ... | ... | ... |

## If Pivoting

See: `/mcp-opportunity-pipeline:pivot --name {name}`

---

*Critique completed: {date}*
```

## Decision Criteria

### PROCEED
- No critical issues
- Warnings are acceptable risks
- Architecture is sound
- Scope is realistic

### REVISE
- Critical issues found but fixable
- Spec needs corrections
- Re-run critique after updates

### PIVOT
Use pivot skill to analyze options:
- Same problem, different technical approach
- Same idea, reduced scope
- Related idea, different angle

### KILL
- Fundamental architectural flaw
- Scope is actually months, not weeks
- Monetization doesn't work after analysis

## Usage

```
/mcp-opportunity-pipeline:critique --name notion-database-sync-mcp --stage draft
/mcp-opportunity-pipeline:critique --name airtable-advanced-mcp --stage spec
```

## Integration with Pivot

When decision is PIVOT, use the pivot-analysis skill:

```
Use skill: pivot-analysis

Analyze pivot options for: {name}
Current stage: {draft | spec}
Reason for pivot: {from critique}
```

The skill will provide:
- Pivot type recommendations
- Effort comparison
- Risk assessment for each path
- Recommended next action

## Next Steps

- If PROCEED (draft) → `/mcp-opportunity-pipeline:spec`
- If PROCEED (spec) → `/mcp-opportunity-pipeline:walkthrough`
- If REVISE → Update spec, re-run critique
- If PIVOT → `/mcp-opportunity-pipeline:pivot`
- If KILL → Document and move on
