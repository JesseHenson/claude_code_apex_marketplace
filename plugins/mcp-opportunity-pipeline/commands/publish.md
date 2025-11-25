---
description: Deploy to target marketplace (Apify, Smithery, npm)
---

# Stage 8: PUBLISH

Deploy built MCP server to target marketplace.

## Prerequisites

- `outputs/build/{name}/` from Stage 5
- `outputs/package/{name}/` from Stage 7
- QA pass rate >= 90%
- Environment: `APIFY_TOKEN` set (for Apify)

## Parameters

Parse from user input:
- `--name`: Build name to publish (required if multiple)
- `--target`: apify | smithery | npm (default: apify)
- `--dry-run`: Validate without publishing (default: true)

## Process

Use the `publisher` agent to:

1. **Validate all artifacts exist:**
   - [ ] Build directory with source code
   - [ ] Package directory with README
   - [ ] QA report with pass rate >= 90%
   - [ ] actor.json / input_schema.json

2. **Pre-publish checklist:**
   - [ ] README.md complete and formatted
   - [ ] Input schema valid JSON
   - [ ] Pricing configured in actor.json
   - [ ] No sensitive data in code
   - [ ] .gitignore includes secrets

3. **If --dry-run:**
   - Validate all above
   - Show what would be published
   - Exit without publishing

4. **Publish to Apify:**

   ```bash
   cd outputs/build/{name}
   apify login --token $APIFY_TOKEN
   apify push
   ```

5. **Configure monetization:**
   - Set PPE pricing via Apify API
   - Enable store listing
   - Add description and metadata

6. **Verify publication:**
   - Check actor is live
   - Verify store listing
   - Test public access

7. **Log publication:**
   - Add entry to `outputs/publish/publication-log.json`

8. **Marketing (manual review):**
   - Output marketing posts for review
   - Do NOT auto-submit (requires manual approval)

## Output

```json
{
  "published_at": "2025-11-25T16:00:00Z",
  "name": "notion-database-sync",
  "target": "apify",
  "status": "success",
  "url": "https://apify.com/jessehenson/notion-database-sync",
  "store_url": "https://apify.com/store/jessehenson/notion-database-sync",
  "version": "0.1.0",
  "marketing_ready": true,
  "marketing_files": [
    "outputs/package/notion-database-sync/marketing/reddit-post.md",
    "outputs/package/notion-database-sync/marketing/twitter-thread.md"
  ]
}
```

## Publication Log Schema

`outputs/publish/publication-log.json`:
```json
{
  "publications": [
    {
      "name": "notion-database-sync",
      "published_at": "2025-11-25T16:00:00Z",
      "target": "apify",
      "url": "https://apify.com/...",
      "version": "0.1.0",
      "revenue_30d": null,
      "installs_30d": null
    }
  ]
}
```

## Post-Publish

After successful publication:
1. Review marketing materials in `outputs/package/{name}/marketing/`
2. Manually post to Reddit/Twitter when ready
3. Monitor Apify dashboard for usage
4. Track in publication log
