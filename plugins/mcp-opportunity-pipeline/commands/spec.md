---
description: Generate buildable product specs for validated opportunities
---

# Stage 4: SPEC

Generate buildable product specifications for top validated opportunities.

## Prerequisites

Requires `outputs/validate/validated-opportunities-*.json` from Stage 3.

## Parameters

Parse from user input:
- `--select`: "top-N" or comma-separated names (default: top-3)
- `--target`: apify | smithery | npm (default: apify)

## Process

Use the `spec-generator` agent to:

1. **Load latest validated opportunities** from `outputs/validate/`

2. **Select opportunities:**
   - Auto-select top 3 by combined score, OR
   - Use user-specified selection

3. **For each selected opportunity, generate:**

   ### Core Spec Components

   a. **Overview**
      - Problem statement (from validation evidence)
      - Solution summary
      - Target user persona

   b. **Core Features (MVP)**
      - 3-5 must-have features
      - Based on gap analysis + pain signals
      - Scoped for 1-2 week build

   c. **Differentiation**
      - What makes this better than existing
      - Specific technical advantages

   d. **Pricing Model (Apify PPE)**
      - Event types (actor-start, row-processed, etc.)
      - Price per event
      - Estimated user value calculation

   e. **Technical Requirements**
      - APIs/integrations needed
      - Key dependencies
      - Architecture notes

   f. **Success Metrics**
      - Target users/installs
      - Revenue targets
      - Timeline

   g. **Walkthrough: Reproducing the Problem**
      - Step-by-step setup of the current tool/competitor
      - How to create test data that exposes the problem
      - Exact reproduction steps showing the pain point
      - What the user sees (error, limitation, frustration)
      - Current workarounds people use
      - What our solution does differently (before/after)

4. **Save** to `outputs/spec/{name}-spec.md`

## Output Template

```markdown
# MCP Server Spec: {name}

## Overview
{problem_statement}
{solution_summary}

## Target User
- User type and context
- Pain points they experience
- Current workarounds

## Core Features (MVP)
1. Feature 1 - description
2. Feature 2 - description
3. Feature 3 - description

## Differentiation
- Point 1 (vs competitor X)
- Point 2 (vs competitor Y)

## Pricing Model (Apify PPE)
| Event Type | Price | Description |
|------------|-------|-------------|
| actor-start | $0.005 | Per run |
| {event} | ${price} | {desc} |

## Estimated User Value
- Small user: {calculation}
- Medium user: {calculation}
- Large user: {calculation}

## Technical Requirements
- API: {apis}
- Dependencies: {deps}
- Architecture: {notes}

## Success Metrics
- Target: {users} active users in {timeframe}
- Target: {events}/month = ${revenue}/month net

---

## Walkthrough: Reproducing the {Problem}

### Step 1: Set Up the Current Tool/Competitor
- How to install/configure the existing solution
- Authentication and basic setup
- Verify it works

### Step 2: Create Test Data
- How to create data that exposes the limitation
- Minimum viable dataset to reproduce

### Step 3: Reproduce the Problem
- Step-by-step commands/actions
- What error/limitation occurs
- Show actual output vs expected output

### Step 4: Current Workarounds
- How users currently work around this
- Why workarounds are painful

### Step 5: What Our Solution Does Differently
- Same scenario with our tool
- Before/after comparison
- Code example if applicable

---

## References
- Validation evidence: `outputs/validate/validated-opportunities-{date}.json`
- API docs: {relevant_api_docs}
```

## Next Step

Run `/mcp-pipeline:build` to scaffold and implement the MCP server.
