---
description: Automated testing via synthetic user tasks
---

# Stage 6: QA

Automated testing of built MCP server via synthetic user tasks.

## Prerequisites

- `outputs/build/{name}/` from Stage 5
- `outputs/spec/{name}-spec.md` from Stage 4

## Parameters

Parse from user input:
- `--name`: Build name to test (required if multiple builds exist)
- `--iterations`: Number of test cases (default: 75)
- `--local`: Run locally vs Apify test run (default: local)

## Process

Use the `qa-harness` agent to:

1. **Load build and spec** from `outputs/build/` and `outputs/spec/`

2. **Generate synthetic test cases** (50-100):

   | Category | % of Tests | Description |
   |----------|------------|-------------|
   | Happy path | 40% | Normal use cases from spec |
   | Edge cases | 30% | Large inputs, empty inputs, boundaries |
   | Error scenarios | 20% | API failures, rate limits, timeouts |
   | Load scenarios | 10% | Concurrent requests, stress tests |

3. **For each test case:**

   a. **Setup** test input based on case type

   b. **Execute** against built server:
      - Local: `npm run start` or `ts-node src/main.ts`
      - Apify: `apify call --json`

   c. **Record results:**
      - Success / Failure / Partial
      - Latency (ms)
      - Error messages
      - Output quality assessment

4. **Compile QA report:**

   - Overall pass rate
   - Breakdown by category
   - Common failure modes
   - Performance metrics (avg, p50, p95, p99)
   - Specific fix suggestions for failures

5. **Decision logic:**
   - Pass rate >= 90%: PASS - ready for packaging
   - Pass rate 80-89%: CONDITIONAL - review failures
   - Pass rate < 80%: FAIL - needs fixes

6. **Save** to `outputs/qa/{name}-qa-report.json`

## Output Schema

```json
{
  "qa_run_at": "2025-11-25T15:00:00Z",
  "build_name": "notion-database-sync",
  "test_summary": {
    "total_cases": 75,
    "passed": 68,
    "failed": 7,
    "pass_rate": 0.91
  },
  "by_category": {
    "happy_path": { "total": 30, "passed": 29 },
    "edge_cases": { "total": 22, "passed": 20 },
    "error_scenarios": { "total": 15, "passed": 13 },
    "load_scenarios": { "total": 8, "passed": 6 }
  },
  "failures": [
    {
      "test_id": "edge-large-10k-rows",
      "category": "edge_cases",
      "input": { "rowCount": 10000 },
      "error": "Timeout after 300s",
      "suggestion": "Implement chunked processing with checkpointing"
    }
  ],
  "performance": {
    "avg_latency_ms": 1250,
    "p50_latency_ms": 980,
    "p95_latency_ms": 3400,
    "p99_latency_ms": 5200
  },
  "recommendation": "PASS",
  "notes": "All critical paths passing. Edge case failures are documented limitations."
}
```

## Next Step

If PASS: Run `/mcp-pipeline:package` to generate docs and marketing.
If FAIL: Fix issues and re-run `/mcp-pipeline:build` then `/mcp-pipeline:qa`.
