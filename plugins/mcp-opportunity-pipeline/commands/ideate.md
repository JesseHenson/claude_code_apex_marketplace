---
description: Run ideation phase (discover → analyze-gaps → validate → walkthrough → spec)
---

# IDEATE Phase

Run the full ideation pipeline: discover opportunities, analyze gaps, validate against Reddit, walk through the user experience, and generate specs.

## Parameters

- `--phase`: casual | regular | power (default: casual)
- `--marketplaces`: Comma-separated list (default: apify,smithery,mcp_registry)
- `--days`: Reddit validation lookback (default: 14)
- `--select`: How many specs to generate (default: top-3)
- `--skip-walkthrough`: Skip interactive walkthrough (default: false)

## Stages Executed

1. **DISCOVER** - Scrape marketplaces for opportunities
2. **ANALYZE-GAPS** - Score on sentiment, staleness, fit, competition
3. **VALIDATE** - Check Reddit for real pain signals
4. **WALKTHROUGH** - Interactively explore the problem/existing tools
5. **SPEC** - Generate buildable product specifications with concrete walkthroughs

## Process

Execute stages sequentially, stopping if any stage fails:

```
discover
    ↓ outputs/discover/raw-opportunities-{date}.json
analyze-gaps
    ↓ outputs/analyze/gap-opportunities-{date}.json
validate
    ↓ outputs/validate/validated-opportunities-{date}.json
walkthrough (interactive)
    ↓ Understanding of actual user pain points
spec
    ↓ outputs/spec/{name}-spec.md (with walkthrough sections)
```

## Walkthrough Stage

For each validated opportunity, the walkthrough stage will:

1. **Identify the current tool/competitor** to test
2. **Guide setup** of the existing solution
3. **Reproduce the pain point** step-by-step
4. **Document findings** for the spec

This is interactive - you'll be asked questions like:
- "Do you have an Airtable/Notion account to test with?"
- "Should I guide you through setting up the existing MCP?"
- "Let's create test data to expose the limitation..."

Use `--skip-walkthrough` to generate specs without this step (walkthroughs will be research-based rather than hands-on).

## Output

After completion:
- Discovery data in `outputs/discover/`
- Scored opportunities in `outputs/analyze/`
- Validated opportunities in `outputs/validate/`
- Product specs in `outputs/spec/` (with walkthrough sections)
- Summary in `outputs/ideate-run-{date}.json`

## Next Step

Review generated specs in `outputs/spec/`, then run:
```
/mcp-opportunity-pipeline:build --name {spec-name}
```

Or run the full build phase:
```
/mcp-opportunity-pipeline:run --run build --name {spec-name}
```
