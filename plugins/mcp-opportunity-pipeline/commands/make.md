---
description: Run build phase (build → qa → package) for a spec
---

# BUILD Phase (make)

Build, test, and package an MCP server from a validated spec.

## Parameters

- `--name`: Spec name to build (required)
- `--target`: apify | mcp-standalone | npm (default: apify)
- `--qa-iterations`: Number of test cases (default: 75)

## Prerequisites

Requires spec file: `outputs/spec/{name}-spec.md`

Run `/mcp-opportunity-pipeline:ideate` first if no spec exists.

## Stages Executed

1. **BUILD** - Scaffold and implement Apify Actor from spec
2. **QA** - Run automated tests (75 synthetic test cases)
3. **PACKAGE** - Generate README, docs, and marketing materials

## Process

Execute stages sequentially:

```
build
    ↓ outputs/build/{name}/ (complete Apify Actor)
qa
    ↓ outputs/qa/{name}-qa-report.json
package
    ↓ outputs/package/{name}/ (README, marketing/)
```

## QA Gate

If QA pass rate < 90%:
- Pipeline stops
- Fix suggestions provided
- Re-run after fixes: `/mcp-opportunity-pipeline:make --name {name}`

## Output

After completion:
- Built code in `outputs/build/{name}/`
- QA report in `outputs/qa/{name}-qa-report.json`
- Documentation in `outputs/package/{name}/README.md`
- Marketing materials in `outputs/package/{name}/marketing/`
- Summary in `outputs/build-run-{date}.json`

## Next Step

Review the package, then publish:
```
/mcp-opportunity-pipeline:publish --name {name} --dry-run
```

Or ship directly:
```
/mcp-opportunity-pipeline:ship --name {name}
```
