---
description: Scrape target marketplaces (Apify, Smithery, MCP Registry) for opportunity signals
---

# Stage 1: DISCOVER

Scrape target marketplaces to discover MCP server opportunities.

## Parameters

Parse from user input:
- `--marketplaces`: Comma-separated list (default: apify,smithery,mcp_registry)
- `--phase`: casual | regular | power (default: casual)
- `--categories`: Filter by category (optional)

## Process

Use the `marketplace-scraper` agent to:

1. **Load config** from `.claude-plugin/config.json`

2. **For each enabled marketplace:**
   - Apify Store: Scrape top sellers, trending, recently updated actors
   - Smithery: Scrape MCP server registry listings
   - MCP Registry: Scrape GitHub modelcontextprotocol/servers repo

3. **Extract for each item:**
   - name, description, category
   - price/price_model (if applicable)
   - rating, review_count
   - last_updated date
   - author/maintainer
   - URL

4. **Normalize** data into common schema

5. **Save** to `outputs/discover/raw-opportunities-{date}.json`

## Output Schema

```json
{
  "marketplace": "apify",
  "scraped_at": "2025-11-25T10:00:00Z",
  "phase": "casual",
  "items": [
    {
      "name": "google-maps-scraper",
      "category": "scraping",
      "price_model": "pay-per-event",
      "price_per_1k": "$4.00",
      "rating": 4.7,
      "review_count": 1250,
      "last_updated": "2025-11-01",
      "description": "...",
      "url": "https://apify.com/..."
    }
  ]
}
```

## Next Step

After discovery completes, run `/mcp-pipeline:analyze-gaps` to score opportunities.
