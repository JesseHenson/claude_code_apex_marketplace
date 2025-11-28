# Pivot Analysis Skill

Analyze pivot options and provide weighted recommendations for changing direction on an opportunity.

## When This Skill is Invoked

Automatically invoked by `/mcp-opportunity-pipeline:pivot` command, or manually when you need to evaluate pivot options.

## Input Required

Provide:
1. **Opportunity name** - Which project is pivoting
2. **Current stage** - Where in the pipeline we are (pre-check, draft, spec, walkthrough)
3. **Pivot reason** - Why we're considering a pivot
4. **Pivot type** - new_idea, new_approach, or new_scope (or "help me decide")

## Analysis Framework

### Step 1: Understand the Blocker

Categorize the blocker:

| Category | Examples | Typical Pivot Type |
|----------|----------|-------------------|
| **Technical** | API dead, rate limits, complexity | new_approach |
| **Legal** | TOS violation, lawsuits | new_idea or new_approach |
| **Economic** | Costs too high, no WTP | new_scope or new_idea |
| **Competitive** | Platform building same thing | new_idea |
| **Scope** | Too complex for phase | new_scope |

### Step 2: Evaluate Pivot Options

For each relevant pivot type, analyze:

#### new_idea (Start Fresh)

**When:** Fundamental blocker that can't be worked around

**Evaluate:**
- [ ] What other opportunities passed validation?
- [ ] Which has next-highest score?
- [ ] Does it avoid the same blocker?
- [ ] Time already invested (sunk cost - acknowledge but don't overweight)

**Effort:** Restart from pre-check with new opportunity
**Risk:** Low (clean slate)

#### new_approach (Same Problem, Different Solution)

**When:** Problem is real, but our solution approach is blocked

**Evaluate:**
- [ ] What alternative technical approaches exist?
- [ ] Do they solve the same pain point?
- [ ] What's the trade-off in capability?
- [ ] Do they avoid the blocker?

**Examples:**
| Original Approach | Blocker | Alternative Approach |
|-------------------|---------|---------------------|
| Proxycurl API | Shut down | Bright Data or BYOK model |
| Real-time scraping | Legal risk | Cached/aggregated data |
| Full feature set | Too complex | Core feature only |

**Effort:** Return to draft, re-architecture
**Risk:** Medium (may hit new blockers)

#### new_scope (Same Idea, Smaller)

**When:** Idea is sound, but scope is too large for current phase

**Evaluate:**
- [ ] Which features are truly MVP?
- [ ] What can be removed while still solving core pain?
- [ ] What's the minimum viable differentiation?
- [ ] Does reduced scope still have market?

**Examples:**
| Original Scope | Reduced Scope |
|----------------|---------------|
| Query + Sync + Write + Schema | Query + Schema only |
| Progress tracking + Resume | Simple batch (no progress) |
| Multi-provider enrichment | Single provider |

**Effort:** Update draft, re-critique
**Risk:** Low (same foundation)

### Step 3: Compare Options

Create comparison matrix:

```markdown
## Pivot Options Comparison

| Factor | new_idea | new_approach | new_scope |
|--------|----------|--------------|-----------|
| Solves blocker? | ✅ | ⚠️ Maybe | ❌ No |
| Effort to implement | High | Medium | Low |
| Time already invested | Lost | Partially saved | Mostly saved |
| Risk of new blockers | Low | Medium | Low |
| Market viability | Unknown | Same | Reduced |
| Recommended? | If no alternative | If approach exists | If scope was the issue |
```

### Step 4: Provide Recommendation

Structure recommendation as:

```markdown
## Recommendation

### Primary Path: {pivot_type}
**Reason:** {clear explanation}

**Specific Action:**
1. {concrete step 1}
2. {concrete step 2}
3. {concrete step 3}

**Command:** `/mcp-opportunity-pipeline:pivot --name {name} --type {type} --reason "{reason}"`

### Alternative Path: {other_type}
If primary path fails, consider: {explanation}

### What to Check Earlier Next Time
- {lesson 1}
- {lesson 2}
```

## Example Analyses

### Example 1: LinkedIn Enrichment (API Dead)

**Input:**
- Opportunity: linkedin-enrichment-mcp
- Stage: pre-check
- Reason: Proxycurl shut down July 2025
- Type: help me decide

**Analysis:**

```markdown
## Blocker Category: Technical (API unavailable)

## Options

### new_idea
- Next opportunity: notion-database-sync-mcp (score 82)
- Avoids LinkedIn legal risk entirely
- Clean slate, no wasted effort on legal research

### new_approach
- Alternative: Bright Data ($0.10+/profile)
- Problem: Economics don't work at our price point
- Alternative: BYOK model (user provides API key)
- Problem: Shifts to one-time sale, not recurring revenue

### new_scope
- Not applicable - the blocker is the data source, not scope

## Comparison

| Factor | new_idea | new_approach (Bright Data) | new_approach (BYOK) |
|--------|----------|---------------------------|---------------------|
| Solves blocker? | ✅ | ⚠️ Expensive | ✅ |
| Effort | High | Medium | Medium |
| Revenue model | PPE | Thin margins | One-time sale |
| Legal risk | None | Some | Transferred to user |

## Recommendation

### Primary Path: new_idea
**Reason:** LinkedIn data space is legally hostile. Even alternative APIs carry risk. Better to pursue Notion opportunity which has clear path.

**Action:**
1. Archive linkedin-enrichment-mcp as "killed-legal-risk"
2. Select notion-database-sync-mcp as next opportunity
3. Run `/mcp-opportunity-pipeline:refine --name notion-database-sync-mcp`

### Alternative Path: new_approach (BYOK)
If we really want LinkedIn: Build as a tool wrapper, user provides Bright Data key. Sell as one-time license ($50-100). Lower revenue ceiling but transfers legal risk.

### Lesson Learned
Check for active lawsuits against data providers BEFORE validating opportunity.
```

### Example 2: Airtable (Complexity)

**Input:**
- Opportunity: airtable-advanced-mcp
- Stage: spec-critique
- Reason: Linked record expansion + attachments + formula introspection is too much
- Type: new_scope

**Analysis:**

```markdown
## Blocker Category: Scope (too complex for casual phase)

## Scope Analysis

| Feature | Complexity | Core Value? | Keep? |
|---------|------------|-------------|-------|
| Query | Low | Yes | ✅ |
| Linked record expansion | Medium | Yes (main differentiator) | ✅ |
| Attachments | High | Nice-to-have | ❌ |
| Formula introspection | N/A (not possible) | N/A | ❌ Remove |
| Batch operations | Low | Expected | ✅ |
| View support | Low | Nice-to-have | ⚠️ Maybe |

## Recommendation

### Primary Path: new_scope
**Reason:** Core value is linked record expansion. Attachments add complexity without being the main draw.

**Reduced MVP:**
1. Query with linked record expansion (1 level)
2. Schema introspection (without formula text)
3. Basic batch create/update

**Remove:**
- Attachment handling (v2)
- Formula introspection (impossible anyway)
- Transaction rollback (risky)

**Action:**
1. Update draft with reduced scope
2. Re-run critique
3. Proceed if passes

**Command:**
`/mcp-opportunity-pipeline:pivot --name airtable-advanced-mcp --type new_scope --reason "Reduce MVP to query+linked+batch, defer attachments to v2"`
```

## Integration

This skill is invoked by:
- `/mcp-opportunity-pipeline:pivot` command
- `/mcp-opportunity-pipeline:critique` when decision is PIVOT
- Manual invocation when evaluating options

Output is saved to:
- `outputs/{name}/pivot-{date}.md`
- `outputs/{name}/decisions.json`
