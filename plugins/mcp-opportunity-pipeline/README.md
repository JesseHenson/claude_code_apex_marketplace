# MCP Opportunity Pipeline

End-to-end pipeline for discovering, validating, building, and publishing MCP servers to monetization marketplaces (Apify, Smithery, etc.).

## Pipeline Stages

| Stage | Command | Description |
|-------|---------|-------------|
| 1 | `/mcp-pipeline:discover` | Scrape marketplaces for opportunities |
| 2 | `/mcp-pipeline:analyze-gaps` | Score and rank opportunities |
| 3 | `/mcp-pipeline:validate` | Validate against Reddit pain signals |
| 4 | `/mcp-pipeline:spec` | Generate buildable product specs |
| 5 | `/mcp-pipeline:build` | Implement MCP server/Apify Actor |
| 6 | `/mcp-pipeline:qa` | Automated testing |
| 7 | `/mcp-pipeline:package` | Generate docs and marketing |
| 8 | `/mcp-pipeline:publish` | Deploy to marketplace |

## Quick Start

### Full Pipeline
```
/mcp-pipeline:run --phase casual --target apify
```

### Step by Step
```
/mcp-pipeline:discover --marketplaces apify,smithery
/mcp-pipeline:analyze-gaps --phase casual
/mcp-pipeline:validate --days 14
/mcp-pipeline:spec --select top-3
/mcp-pipeline:build
/mcp-pipeline:qa
/mcp-pipeline:package
/mcp-pipeline:publish --dry-run
```

## Configuration

Edit `.claude-plugin/config.json` to customize:
- Target marketplaces
- Subreddit lists for validation
- Scoring weights
- QA thresholds
- Publishing settings

## Output Structure

```
outputs/
├── discover/      # Raw marketplace data
├── analyze/       # Scored opportunities
├── validate/      # Reddit-validated opportunities
├── spec/          # Product specifications
├── build/         # Built MCP servers
├── qa/            # QA reports
├── package/       # Docs and marketing materials
└── publish/       # Publication logs
```

## Agents

- `marketplace-scraper` - Scrapes Apify, Smithery, MCP Registry
- `gap-analyzer` - Scores opportunities on sentiment, staleness, fit
- `reddit-validator` - Validates against Reddit pain signals
- `spec-generator` - Creates buildable product specs
- `mcp-builder` - Implements Apify Actors with PPE charging
- `qa-harness` - Automated testing with synthetic test cases
- `publisher` - Packaging and marketplace deployment

## Environment Variables

- `APIFY_TOKEN` - Required for publishing to Apify

## License

Private - Not for distribution
