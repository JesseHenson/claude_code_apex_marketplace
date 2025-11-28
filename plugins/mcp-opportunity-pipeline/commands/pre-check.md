---
description: Feasibility critique before investing in full spec - validates APIs, legal, costs
---

# Stage: PRE-CHECK (Feasibility Critique)

Validate that an opportunity is technically and legally feasible BEFORE writing a full spec. This is a kill-or-proceed gate.

## Purpose

Catch blockers early:
- APIs that don't exist or cost too much
- Legal/TOS issues that make the idea non-viable
- Platform limitations that prevent monetization
- Dependencies that are dead or dying

**Goal:** Spend 30 minutes validating feasibility, not 3 hours writing a spec for something that can't be built.

## Prerequisites

Requires validated opportunity from `outputs/validate/validated-opportunities-*.json`

## Parameters

- `--name`: Opportunity name to pre-check
- `--all`: Pre-check all validated opportunities

## Process

### 1. API/Dependency Check

For each required API or service:

```
□ Does it exist?
□ Is it actively maintained? (check last commit, status page)
□ What's the pricing?
  - Free tier limits
  - Cost per request/record
  - Minimum monthly commitment
□ Rate limits that could break our model?
□ Authentication complexity (API key vs OAuth vs Enterprise-only)?
□ Any recent news? (acquisitions, shutdowns, lawsuits)
```

**Red flags:**
- Service shut down or acquired
- Enterprise-only pricing ($1000+/month)
- Rate limits that make our use case impossible
- No public API (would require scraping)

### 2. Legal/Compliance Check

```
□ Terms of Service review
  - Commercial use allowed?
  - Reselling data allowed?
  - Scraping prohibited?
□ Active lawsuits or enforcement?
□ GDPR/CCPA implications?
□ Platform-specific policies (LinkedIn, etc.)?
```

**Red flags:**
- Explicit TOS prohibition
- Active lawsuits against similar services
- Data residency requirements we can't meet

### 3. Platform Viability Check

```
□ Where will we publish? (Smithery, Apify, self-hosted)
□ Does platform support our monetization model?
□ Any platform-specific requirements?
□ Deployment complexity?
```

**Red flags:**
- No viable monetization path
- Platform discontinuing features we need
- Deployment requires infrastructure we don't have

### 4. Competitive Moat Check

```
□ Who else does this?
□ Why would they not add our features?
□ What's stopping the platform (Notion, Airtable) from building this?
□ How defensible is our position?
```

**Red flags:**
- Platform announced similar feature
- Well-funded competitor with same approach
- Trivial to replicate (< 1 week for competent dev)

## Output

Saves to `outputs/{name}/pre-check.md`:

```markdown
# Pre-Check: {name}

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| API Availability | 🟢/🟡/🔴 | ... |
| API Costs | 🟢/🟡/🔴 | ... |
| Legal/TOS | 🟢/🟡/🔴 | ... |
| Platform | 🟢/🟡/🔴 | ... |
| Competition | 🟢/🟡/🔴 | ... |

## Decision

[ ] **PROCEED** - No blockers, move to draft spec
[ ] **PROCEED WITH NOTES** - Minor issues, document in spec
[ ] **PIVOT** - Fundamental issue, try different approach
[ ] **KILL** - Non-viable, move to next opportunity

## Details

### API/Dependencies
...

### Legal/Compliance
...

### Platform
...

### Competition
...

## If Pivoting

Recommended pivot path: {new_idea | new_approach | new_scope}
Reason: ...
Next action: ...
```

## Decision Criteria

### PROCEED (All Green)
- APIs exist and are affordable
- No legal blockers
- Clear monetization path
- Reasonable competition

### PROCEED WITH NOTES (Yellow flags)
- Minor cost concerns (document in spec)
- Some TOS ambiguity (get legal review later)
- Competition exists but we have differentiation

### PIVOT (Orange flags)
- Primary API too expensive → try different data source
- Legal gray area → try different approach
- Platform doesn't support → try different platform

### KILL (Red flags)
- Primary API dead/dying
- Clear legal prohibition
- No viable monetization
- Platform building same thing

## Usage

```
/mcp-opportunity-pipeline:pre-check --name notion-database-sync-mcp
/mcp-opportunity-pipeline:pre-check --all
```

## Next Steps

- If PROCEED → `/mcp-opportunity-pipeline:draft`
- If PIVOT → `/mcp-opportunity-pipeline:pivot --type {type} --reason "..."`
- If KILL → Document and move to next opportunity
