---
description: Create lightweight spec draft for critique before full specification
---

# Stage: DRAFT (Lightweight Spec)

Create a quick, focused draft spec that captures the core idea without over-investing. This draft will be validated by critique before expanding to full spec.

## Purpose

A draft spec is:
- **Quick** (30-60 minutes, not 3 hours)
- **Focused** (problem + solution + approach, not implementation details)
- **Validatable** (enough to critique architecture, not code-level details)

## Prerequisites

Requires passed pre-check: `outputs/{name}/pre-check.md` with PROCEED decision

## Parameters

- `--name`: Opportunity name to draft

## Process

### 1. Problem Statement (2-3 sentences)

- What's the pain?
- Who feels it?
- How bad is it?

### 2. Solution Summary (2-3 sentences)

- What do we build?
- How does it solve the pain?
- Why is it better than alternatives?

### 3. Core Features (3-5 bullets)

MVP only. Each feature:
- One sentence description
- Why it matters

### 4. Technical Approach (High-level)

- Primary API/data source
- Key dependencies
- Architecture pattern (stateless MCP, etc.)

### 5. Monetization Model

- Target platform (Smithery, Apify, self-hosted)
- Pricing approach (PPE, subscription, one-time)
- Rough price points

### 6. Known Risks (from pre-check)

- Carried forward from pre-check
- Any new concerns

## Output

Saves to `outputs/{name}/draft.md`:

```markdown
# Draft: {name}

## Problem
{2-3 sentences on the pain point}

## Solution
{2-3 sentences on what we're building}

## Core Features (MVP)
1. **Feature 1** - Why it matters
2. **Feature 2** - Why it matters
3. **Feature 3** - Why it matters

## Technical Approach
- **Data Source:** {API/service}
- **Dependencies:** {key libraries}
- **Architecture:** {pattern}

## Monetization
- **Platform:** {where}
- **Model:** {how we charge}
- **Price Range:** {rough estimates}

## Known Risks
- Risk 1 (from pre-check)
- Risk 2

## Open Questions
- Question 1 (to resolve in critique)
- Question 2

---
*Draft created: {date}*
*Status: READY FOR CRITIQUE*
```

## Draft Quality Checklist

Before marking complete:

```
□ Problem is specific and validated (not assumed)
□ Solution clearly addresses the problem
□ Features are MVP-scoped (not wishlist)
□ Technical approach references real APIs
□ Monetization is realistic
□ Risks from pre-check are acknowledged
□ Open questions are explicit
```

## What NOT to Include

- Detailed acceptance criteria (that's for full spec)
- Code examples (that's for full spec)
- Walkthrough steps (that's a separate stage)
- Complete tool definitions (that's for full spec)
- Implementation timeline (we don't do timelines)

## Usage

```
/mcp-opportunity-pipeline:draft --name notion-database-sync-mcp
```

## Next Steps

After draft → `/mcp-opportunity-pipeline:critique --name {name} --stage draft`
