---
description: Run build phase (build → qa → package) for a validated spec
---

# MAKE Phase

Build, test, and package an MCP server from a validated, refined spec.

**Output:** Production-ready code with tests and documentation.

## Pipeline Position

```
IDEATE → REFINE → [MAKE] → SHIP
            │
            ├── build    → Scaffold and implement MCP server
            ├── qa       → Automated testing (75+ test cases)
            └── package  → README, docs, marketing materials
```

## Prerequisites

Requires completed REFINE phase:
- `outputs/{name}/spec.md` (full specification)
- `outputs/{name}/critique.md` with PROCEED decision
- `outputs/{name}/walkthrough.md` (problem reproduction)
- `outputs/{name}/decisions.json` showing ready_for_build

## Parameters

- `--name`: Project name to build (required)
- `--target`: apify | smithery | npm (default: smithery)
- `--qa-iterations`: Number of test cases (default: 75)

## Stages Executed

### 1. BUILD
Scaffold and implement from spec:
- Create project structure
- Implement MCP tools
- Add rate limiting, error handling
- Output: `outputs/{name}/build/`

### 2. QA
Automated testing:
- Generate 75+ synthetic test cases
- Cover happy path, edge cases, errors
- Verify against spec acceptance criteria
- Output: `outputs/{name}/qa-report.json`

### 3. PACKAGE
Prepare for marketplace:
- Generate README.md
- Create usage examples
- Write marketing copy
- Output: `outputs/{name}/package/`

## QA Gate

If QA pass rate < 90%:
- Pipeline stops
- Fix suggestions provided
- Re-run after fixes

```json
{
  "pass_rate": 0.87,
  "status": "FAILED",
  "failures": [
    {
      "test": "linked_record_expansion_depth_2",
      "expected": "nested client data",
      "actual": "timeout",
      "suggestion": "Add pagination for deep expansions"
    }
  ]
}
```

## Output Summary

After make completes:

```
outputs/{name}/
├── pre-check.md       (from IDEATE)
├── draft.md           (from REFINE)
├── spec.md            (from REFINE)
├── critique.md        (from REFINE)
├── walkthrough.md     (from REFINE)
├── decisions.json     (decision log)
├── build/             (implemented code)
│   ├── src/
│   ├── package.json
│   └── ...
├── qa-report.json     (test results)
└── package/           (marketplace materials)
    ├── README.md
    ├── CHANGELOG.md
    └── marketing/
        ├── description.md
        ├── features.md
        └── pricing.md
```

## Usage

### Full make run
```
/mcp-opportunity-pipeline:make --name notion-database-sync-mcp
```

### Different target platform
```
/mcp-opportunity-pipeline:make --name notion-database-sync-mcp --target apify
```

### Individual stages
```
/mcp-opportunity-pipeline:build --name notion-database-sync-mcp
/mcp-opportunity-pipeline:qa --name notion-database-sync-mcp
/mcp-opportunity-pipeline:package --name notion-database-sync-mcp
```

## Next Phase

After MAKE completes successfully:
```
/mcp-opportunity-pipeline:ship --name {name}
```

Or dry-run first:
```
/mcp-opportunity-pipeline:ship --name {name} --dry-run
```
