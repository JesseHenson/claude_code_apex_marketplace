---
description: Critical analysis of obstacles, risks, and hidden costs for a spec
---

# CRITIQUE

Perform deep critical analysis of a spec to identify obstacles, hidden costs, API dependencies, and "6-feet-deep" issues that only surface during implementation.

## Purpose

Before building, identify:
1. **Paid API dependencies** - What services cost money? What are the minimums?
2. **Technical blockers** - APIs that don't exist, rate limits that break the model
3. **Legal/compliance risks** - TOS violations, data handling issues
4. **Infrastructure requirements** - What do we need beyond just code?
5. **Hidden complexity** - Things that seem simple but aren't

## Parameters

- `--name`: Project name to critique (e.g., `notion-database-sync-mcp`)
- `--all`: Critique all projects in outputs/

## Process

### 1. API Dependency Analysis
For each external API in the spec:
- Pricing tiers and minimums
- Free tier limitations
- Rate limits that could break our model
- Authentication complexity (OAuth vs API key)
- Reliability/uptime concerns

### 2. Technical Feasibility Check
- Does the API actually support what we need?
- Are there undocumented limitations?
- What happens at scale (10k+ operations)?
- Caching requirements and complexity

### 3. Legal/Compliance Review
- Terms of Service restrictions
- Data handling requirements (GDPR, etc.)
- Reselling/commercial use clauses
- Liability considerations

### 4. Infrastructure Requirements
- Hosting needs (serverless vs persistent)
- Storage requirements (caching, attachments)
- Secrets management
- Monitoring/logging needs

### 5. Hidden Complexity Audit
- Edge cases not covered in spec
- Error handling complexity
- State management challenges
- Testing difficulty

### 6. Competitive Response Risk
- Could the platform build this themselves?
- Are there incumbents with moats?
- What's our defensibility?

## Output

Saves to `outputs/{name}/critique.md` with:

```markdown
# Critique: {name}

## Risk Summary
| Category | Risk Level | Key Concern |
|----------|------------|-------------|
| API Costs | 🟡 Medium | Proxycurl $X/lookup |
| Technical | 🟢 Low | Well-documented APIs |
| Legal | 🔴 High | LinkedIn TOS gray area |
| Infrastructure | 🟢 Low | Stateless, serverless OK |

## Detailed Analysis

### 1. API Dependencies
...

### 2. Technical Blockers
...

### 3. Legal/Compliance
...

### 4. Infrastructure
...

### 5. Hidden Complexity
...

### 6. Competitive Risk
...

## Recommendation
[ ] PROCEED - Risks manageable
[ ] PROCEED WITH CAUTION - Address X before building
[ ] RECONSIDER - Fundamental issues with Y
[ ] ABANDON - Blockers too significant

## Mitigations
If proceeding, specific actions to reduce risk:
1. ...
2. ...
```

## Usage

```
/mcp-opportunity-pipeline:critique --name notion-database-sync-mcp
/mcp-opportunity-pipeline:critique --all
```
