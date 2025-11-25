---
description: Run ship phase (publish) to deploy to marketplace
---

# SHIP Phase

Deploy a built and packaged MCP server to the target marketplace.

## Parameters

- `--name`: Build name to publish (required)
- `--target`: apify | smithery | npm (default: apify)
- `--dry-run`: Validate without publishing (default: true)

## Prerequisites

Requires:
- Built code: `outputs/build/{name}/`
- Package: `outputs/package/{name}/`
- QA report with pass rate >= 90%

Run `/mcp-opportunity-pipeline:make --name {name}` first if missing.

## Environment

- `APIFY_TOKEN` - Required for Apify publishing

## Process

```
Pre-flight checks
    ↓ Verify all artifacts exist
    ↓ Check QA pass rate >= 90%
    ↓ Validate no secrets in code
publish
    ↓ apify push (if not dry-run)
    ↓ Configure monetization
    ↓ Verify live listing
    ↓ outputs/publish/publication-log.json
```

## Dry Run (default)

With `--dry-run` (default):
- Validates all artifacts
- Shows what would be published
- Does NOT actually deploy
- Safe to run multiple times

## Live Publish

With `--dry-run false`:
- Actually deploys to Apify
- Configures PPE pricing
- Enables store listing
- Logs to publication-log.json

## Output

After completion:
- Publication entry in `outputs/publish/publication-log.json`
- Live URL (if not dry-run)
- Marketing files ready for manual posting

## Post-Publish

Marketing materials are in `outputs/package/{name}/marketing/`:
- `reddit-post.md` - For r/SideProject, etc.
- `twitter-thread.md` - For X/Twitter
- `marketplace-listing.md` - SEO description

**Note:** Marketing posts require manual review and submission.
