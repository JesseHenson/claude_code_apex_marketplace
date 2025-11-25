---
description: Run full pipeline from discovery to publish (or specified stages)
---

# Full Pipeline Run

Execute the MCP opportunity pipeline end-to-end or between specified stages.

## Parameters

Parse from user input:
- `--phase`: casual | regular | power (default: casual)
- `--target`: apify | smithery | npm (default: apify)
- `--from`: Starting stage (default: discover)
- `--to`: Ending stage (default: publish)
- `--dry-run`: Skip actual publishing (default: true)

## Stages

| Stage | Command | Description |
|-------|---------|-------------|
| 1 | discover | Scrape marketplaces |
| 2 | analyze-gaps | Score opportunities |
| 3 | validate | Reddit pain validation |
| 4 | spec | Generate build specs |
| 5 | build | Implement MCP server |
| 6 | qa | Automated testing |
| 7 | package | Generate docs/marketing |
| 8 | publish | Deploy to marketplace |

## Usage Examples

### Full pipeline (discovery to publish)
```
/mcp-pipeline:run --phase casual --target apify
```

### Discovery and analysis only
```
/mcp-pipeline:run --from discover --to analyze-gaps
```

### Build from existing spec
```
/mcp-pipeline:run --from build --to publish --dry-run
```

### Validate and spec only
```
/mcp-pipeline:run --from validate --to spec
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
