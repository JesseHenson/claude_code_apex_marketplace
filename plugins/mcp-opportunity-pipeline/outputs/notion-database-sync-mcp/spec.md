# MCP Server Spec: Notion Database Sync

## Overview

**Problem:** Notion's API has aggressive rate limits (3 req/sec), 100-record pagination, and slow sync for large databases. Existing tools (2sync, Zapier, n8n) are not MCP-native, forcing Claude users to context-switch between platforms.

**Solution:** An MCP server that provides Claude-native access to Notion databases with intelligent batching, progress tracking, and support for large datasets (10k+ rows).

## Target User

- **Type:** Knowledge workers, developers, small teams using Notion as a database
- **Technical Level:** Semi-technical (comfortable with Claude, not necessarily coding)
- **Company Size:** Solo to small team (1-20 people)
- **Pain Points:**
  - Notion API rate limits interrupting workflows
  - Can't sync large databases without timeouts
  - No visibility into sync progress
  - Context-switching between Claude and Notion
- **Current Workarounds:**
  - Manual copy/paste from Notion
  - Using Zapier/Make with rate limit errors
  - Splitting databases to avoid limits

## Core Features (MVP)

### 1. Query Database
Query Notion databases with filtering, sorting, and pagination handled automatically.

**Acceptance Criteria:**
- [ ] Accept database ID and optional filter/sort parameters
- [ ] Handle pagination transparently (user gets all results)
- [ ] Respect rate limits with automatic backoff
- [ ] Return structured JSON results

### 2. Batch Sync with Progress
Sync entire databases or date ranges with progress tracking.

**Acceptance Criteria:**
- [ ] Support full sync or incremental (by date range)
- [ ] Show progress (X of Y rows processed)
- [ ] Resume from checkpoint on failure
- [ ] Export to JSON or CSV format

### 3. Create/Update Records
Create new records or update existing ones in batches.

**Acceptance Criteria:**
- [ ] Single record create/update
- [ ] Batch operations (up to 100 at a time)
- [ ] Validation against database schema
- [ ] Return created/updated record IDs

### 4. Schema Discovery
Get database structure including properties, types, and options.

**Acceptance Criteria:**
- [ ] List all properties with types
- [ ] Include select/multi-select options
- [ ] Include relation database IDs
- [ ] Cache schema to reduce API calls

## Differentiation

| Feature | Us | 2sync | Zapier | n8n |
|---------|----|----|--------|-----|
| MCP-native | Yes | No | No | No |
| Claude integration | Native | None | None | None |
| Progress tracking | Yes | Limited | No | No |
| 10k+ row support | Yes | Struggles | No | Limited |
| Rate limit handling | Intelligent | Basic | Errors | Manual |
| Price | PPE | $6-20/mo | $20+/mo | $50+/mo |

## Pricing Model (Smithery Remote MCP)

| Event Type | Price | Description |
|------------|-------|-------------|
| mcp-connect | $0.00 | Connection setup (free) |
| query-database | $0.005 | Per query execution |
| row-read | $0.0005 | Per row retrieved |
| row-write | $0.002 | Per row created/updated |
| schema-fetch | $0.001 | Per schema retrieval |

### Estimated User Costs

| User Type | Usage | Monthly Cost |
|-----------|-------|--------------|
| Light | 100 queries, 5k rows read | ~$5 |
| Medium | 500 queries, 25k rows read, 1k writes | ~$20 |
| Heavy | 2k queries, 100k rows read, 5k writes | ~$75 |

*Competitive with 2sync ($6-20/mo) and significantly cheaper than Zapier for high-volume users.*

## Technical Requirements

### APIs/Integrations
- **Notion API v1:** Database queries, page operations, schema
- **OAuth 2.0:** For user authentication to Notion

### Key Dependencies
- `@notionhq/client` - Official Notion SDK
- `@modelcontextprotocol/sdk` - MCP server SDK
- Rate limiter library (e.g., `bottleneck`)

### Architecture Notes

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Claude    │────▶│  MCP Server      │────▶│  Notion API │
│   (Client)  │◀────│  (Rate Limited)  │◀────│             │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Cache     │
                    │  (Schema)   │
                    └─────────────┘
```

- Stateless MCP server
- In-memory schema cache (TTL: 5 minutes)
- Exponential backoff on rate limits
- Chunked processing for large datasets

### Rate Limit Handling

```typescript
// Notion limits: 3 requests/second average
const rateLimiter = new Bottleneck({
  reservoir: 3,
  reservoirRefreshAmount: 3,
  reservoirRefreshInterval: 1000,
  maxConcurrent: 1
});
```

### Error Handling

| Error | Strategy |
|-------|----------|
| Rate limited (429) | Exponential backoff, retry up to 5 times |
| Invalid database ID | Return clear error, suggest checking permissions |
| Schema mismatch | Validate before write, return field-level errors |
| Timeout | Checkpoint progress, allow resume |
| Auth expired | Prompt for re-authentication |

## Success Metrics

- **3-Month Target:** 500 active users on Smithery
- **Monthly Events:** 100k queries/row operations
- **Monthly Revenue:** ~$500 net (based on medium usage)

## MCP Tools Definition

```typescript
const tools = [
  {
    name: "notion_query_database",
    description: "Query a Notion database with optional filters and sorts",
    inputSchema: {
      type: "object",
      properties: {
        database_id: { type: "string", description: "Notion database ID" },
        filter: { type: "object", description: "Notion filter object" },
        sorts: { type: "array", description: "Sort criteria" },
        page_size: { type: "number", default: 100 }
      },
      required: ["database_id"]
    }
  },
  {
    name: "notion_sync_database",
    description: "Sync entire database to JSON with progress tracking",
    inputSchema: {
      type: "object",
      properties: {
        database_id: { type: "string" },
        since: { type: "string", description: "ISO date for incremental sync" },
        format: { type: "string", enum: ["json", "csv"], default: "json" }
      },
      required: ["database_id"]
    }
  },
  {
    name: "notion_create_page",
    description: "Create a new page in a Notion database",
    inputSchema: {
      type: "object",
      properties: {
        database_id: { type: "string" },
        properties: { type: "object", description: "Page properties" }
      },
      required: ["database_id", "properties"]
    }
  },
  {
    name: "notion_update_page",
    description: "Update an existing Notion page",
    inputSchema: {
      type: "object",
      properties: {
        page_id: { type: "string" },
        properties: { type: "object" }
      },
      required: ["page_id", "properties"]
    }
  },
  {
    name: "notion_get_schema",
    description: "Get database schema including property types and options",
    inputSchema: {
      type: "object",
      properties: {
        database_id: { type: "string" }
      },
      required: ["database_id"]
    }
  }
];
```

## Implementation Notes

1. **Start with query + schema** - Most valuable for Claude users
2. **Add sync second** - Differentiator from basic Notion MCPs
3. **Write operations last** - Higher complexity, more edge cases
4. **Test with real large databases** (5k+ rows) before launch

---

## Walkthrough: Reproducing the Rate Limit & Pagination Problem

### Step 1: Create a Test Database in Notion

1. Go to https://notion.so and create a new page
2. Add a database (Table view) with columns:
   - Name (Title)
   - Email (Email)
   - Company (Text)
   - Created (Created time)

3. **Populate with 500+ rows** (use Notion's CSV import or duplicate rows):
   - This is where the problems start showing up
   - Anything over 100 rows requires pagination
   - Over 1000 rows, rate limits become painful

### Step 2: Get Your Notion API Setup

1. Go to https://www.notion.so/my-integrations
2. Create a new integration (Internal)
3. Copy the "Internal Integration Secret" (starts with `secret_...`)
4. Go back to your database page
5. Click "..." → "Connections" → Add your integration
6. Copy the database ID from the URL: `notion.so/YOUR_WORKSPACE/DATABASE_ID?v=...`

### Step 3: Reproduce the Pagination Problem

**Try to fetch all 500 records via curl:**

```bash
curl 'https://api.notion.com/v1/databases/DATABASE_ID/query' \
  -H 'Authorization: Bearer secret_YOUR_TOKEN' \
  -H 'Notion-Version: 2022-06-28' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**What you get back:**
```json
{
  "results": [...],  // Only 100 records!
  "has_more": true,
  "next_cursor": "8a5b3c4d-e6f7-8901-2345-6789abcdef01"
}
```

**THE PROBLEM:** You only get 100 records. To get the rest:
1. Make another request with `start_cursor: "8a5b3c4d..."`
2. Get next 100, check `has_more`
3. Repeat until `has_more: false`

**For 500 records = 5 API calls minimum**
**For 5000 records = 50 API calls minimum**

### Step 4: Reproduce the Rate Limit Problem

**Try to fetch all pages quickly:**

```python
import requests
import time

results = []
cursor = None

while True:
    response = requests.post(
        f'https://api.notion.com/v1/databases/{db_id}/query',
        headers={'Authorization': f'Bearer {token}'},
        json={'start_cursor': cursor} if cursor else {}
    )

    if response.status_code == 429:  # Rate limited!
        print("RATE LIMITED - must wait")
        time.sleep(int(response.headers.get('Retry-After', 1)))
        continue

    data = response.json()
    results.extend(data['results'])

    if not data['has_more']:
        break
    cursor = data['next_cursor']
```

**What happens with 5000 records:**
- Average 3 requests/second allowed
- 50 requests needed = ~17 seconds minimum
- But if you burst, you get 429 errors
- No progress visibility - just waiting

### Step 5: What Users Experience Today

Using existing tools like 2sync, Zapier, or n8n:

1. **Zapier/Make:** Limited to small batches, expensive for large syncs
2. **2sync:** Works but "sync can work slower than usual due to large databases"
3. **n8n:** Manual pagination handling, no progress tracking
4. **Direct API:** Have to write custom code with retry logic

**Common complaints from users:**
> "Notion's rate limits can occasionally interrupt automation"
> "The sync should succeed after a few retries" (emphasis on SHOULD)
> "Databases with several thousands of entries can slow the syncing process"

### Step 6: What Our MCP Does Differently

**Single command:**
```
Sync my Notion database abc123 to JSON
```

**Behind the scenes:**
1. Detect database size via initial query
2. Calculate optimal batch size
3. Implement exponential backoff on 429s
4. Stream progress updates to Claude

**User sees:**
```
Syncing database...
Progress: 100/500 (20%)
Progress: 200/500 (40%)
Progress: 300/500 (60%)
Progress: 400/500 (80%)
Progress: 500/500 (100%)
Sync complete! Saved to notion-export-2025-11-25.json
```

**Our implementation:**
```typescript
async function syncDatabase(databaseId: string) {
  const rateLimiter = new Bottleneck({
    reservoir: 3,
    reservoirRefreshAmount: 3,
    reservoirRefreshInterval: 1000,
  });

  let cursor = undefined;
  let total = 0;
  const results = [];

  // First, get count estimate
  const initial = await rateLimiter.schedule(() =>
    notion.databases.query({ database_id: databaseId, page_size: 1 })
  );

  do {
    const response = await rateLimiter.schedule(() =>
      notion.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
        page_size: 100
      })
    );

    results.push(...response.results);
    cursor = response.next_cursor;

    // Report progress
    await reportProgress(results.length, 'rows synced');

  } while (cursor);

  return results;
}
```

---

## Walkthrough: No Notion MCP on Smithery

### Current State (as of Nov 2025)

1. Go to https://smithery.ai/servers
2. Search for "Notion"
3. **Result: No dedicated Notion MCP exists**

The closest alternatives:
- Generic "fetch" MCPs that can hit any API
- Google Workspace MCPs (not Notion)
- Airtable MCP (competitor, not compatible)

### Why This Is An Opportunity

| Platform | Has Notion MCP? |
|----------|-----------------|
| Smithery | No |
| Apify | Scrapers only (not MCP) |
| npm | Various packages, not MCP-native |
| Claude Desktop | No built-in |

**First-mover advantage for Notion MCP on Smithery.**

---

## References

- Validation evidence: `outputs/validate/validated-opportunities-2025-11-25.json`
- Gap analysis: `outputs/analyze/gap-opportunities-2025-11-25.json`
- Notion API docs: https://developers.notion.com/
- Notion rate limits: https://developers.notion.com/reference/request-limits
- MCP SDK: https://github.com/modelcontextprotocol/sdk
