---
description: Run pipeline phases - ideate (idea→spec), build (build→package), or ship (publish)
---

# Pipeline Runner

Execute pipeline phases or custom stage ranges.

## Parameters

Parse from user input:
- `--phase`: casual | regular | power (default: casual)
- `--target`: apify | smithery | npm (default: apify)
- `--run`: ideate | build | ship | full (default: full)
- `--from`: Custom starting stage (overrides --run)
- `--to`: Custom ending stage (overrides --run)
- `--name`: Spec/build name (required for build/ship phases)
- `--dry-run`: Skip actual publishing (default: true)

## Pipeline Phases

### IDEATE Phase (idea → spec)
**Command:** `/mcp-opportunity-pipeline:run --run ideate`

Runs: discover → analyze-gaps → validate → spec

Output: Validated opportunity specs ready to build

### BUILD Phase (build → package)
**Command:** `/mcp-opportunity-pipeline:run --run build --name {spec-name}`

Runs: build → qa → package

Output: Tested code + docs + marketing materials

### SHIP Phase (publish)
**Command:** `/mcp-opportunity-pipeline:run --run ship --name {build-name}`

Runs: publish (with dry-run by default)

Output: Live marketplace listing

### FULL Pipeline
**Command:** `/mcp-opportunity-pipeline:run --run full`

Runs all 8 stages sequentially with approval gates.

## Stage Reference

| # | Stage | Phase | Command | Description |
|---|-------|-------|---------|-------------|
| 1 | discover | IDEATE | discover | Scrape marketplaces |
| 2 | analyze-gaps | IDEATE | analyze-gaps | Score opportunities |
| 3 | validate | IDEATE | validate | Reddit pain validation |
| 4 | spec | IDEATE | spec | Generate build specs |
| 5 | build | BUILD | build | Implement MCP server |
| 6 | qa | BUILD | qa | Automated testing |
| 7 | package | BUILD | package | Generate docs/marketing |
| 8 | publish | SHIP | publish | Deploy to marketplace |

## Usage Examples

### Ideation: Find and spec opportunities
```
/mcp-opportunity-pipeline:run --run ideate --phase casual
```

### Build: Implement a specific spec
```
/mcp-opportunity-pipeline:run --run build --name notion-database-sync
```

### Ship: Publish to Apify
```
/mcp-opportunity-pipeline:run --run ship --name notion-database-sync --dry-run false
```

### Custom range: Just validate and spec
```
/mcp-opportunity-pipeline:run --from validate --to spec
```

### Full pipeline with stops
```
/mcp-opportunity-pipeline:run --run full --phase casual --target apify
```

## Process

1. **Parse parameters** and determine stage range

2. **Check prerequisites:**
   - If starting after discover, verify outputs exist
   - Load config from `.claude-plugin/config.json`

3. **Execute stages sequentially:**
   ```
   for stage in range(from_stage, to_stage + 1):
       run_stage(stage)
       check_stage_output()
       if failed:
           stop_and_report()
   ```

4. **Report summary:**
   - Stages completed
   - Outputs generated
   - Recommendations

## Stage Dependencies

```
discover → analyze-gaps → validate → spec → build → qa → package → publish
    │           │             │        │       │      │       │
    └───────────┴─────────────┴────────┴───────┴──────┴───────┘
                      Each stage requires previous outputs
```

## Error Handling

- **Stage fails:** Stop pipeline, report failure, suggest fixes
- **Missing prerequisites:** List missing files, suggest which stage to run
- **Validation score too low:** Stop at validate stage, report findings
- **QA pass rate < 90%:** Stop at QA, output fix suggestions

## Output

Pipeline run summary saved to `outputs/pipeline-run-{date}.json`:

```json
{
  "run_at": "2025-11-25T10:00:00Z",
  "phase": "casual",
  "target": "apify",
  "stages_run": ["discover", "analyze-gaps", "validate", "spec"],
  "stages_completed": ["discover", "analyze-gaps", "validate", "spec"],
  "stages_failed": [],
  "outputs": {
    "discover": "outputs/discover/raw-opportunities-2025-11-25.json",
    "analyze": "outputs/analyze/gap-opportunities-2025-11-25.json",
    "validate": "outputs/validate/validated-opportunities-2025-11-25.json",
    "spec": ["outputs/spec/notion-database-sync-spec.md"]
  },
  "recommendations": [
    "Run /mcp-pipeline:build to implement top opportunity"
  ]
}
```
