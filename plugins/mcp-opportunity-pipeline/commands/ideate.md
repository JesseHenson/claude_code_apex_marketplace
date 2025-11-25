---
description: Run ideation phase (discover → analyze-gaps → validate → spec)
---

# IDEATE Phase

Run the full ideation pipeline: discover opportunities, analyze gaps, validate against Reddit, and generate specs.

## Parameters

- `--phase`: casual | regular | power (default: casual)
- `--marketplaces`: Comma-separated list (default: apify,smithery,mcp_registry)
- `--days`: Reddit validation lookback (default: 14)
- `--select`: How many specs to generate (default: top-3)

## Stages Executed

1. **DISCOVER** - Scrape marketplaces for opportunities
2. **ANALYZE-GAPS** - Score on sentiment, staleness, fit, competition
3. **VALIDATE** - Check Reddit for real pain signals
4. **SPEC** - Generate buildable product specifications

## Process

Execute stages sequentially, stopping if any stage fails:

```
discover
    ↓ outputs/discover/raw-opportunities-{date}.json
analyze-gaps
    ↓ outputs/analyze/gap-opportunities-{date}.json
validate
    ↓ outputs/validate/validated-opportunities-{date}.json
spec
    ↓ outputs/spec/{name}-spec.md (for each selected opportunity)
```

## Output

After completion:
- Discovery data in `outputs/discover/`
- Scored opportunities in `outputs/analyze/`
- Validated opportunities in `outputs/validate/`
- Product specs in `outputs/spec/`
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
