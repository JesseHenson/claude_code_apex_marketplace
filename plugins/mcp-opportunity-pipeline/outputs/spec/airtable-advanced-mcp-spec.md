# MCP Server Spec: Airtable Advanced Sync

## Overview

**Problem:** Smithery's existing Airtable MCP (588 uses) is basic CRUD only. Power users need formula support, linked record handling, attachment management, and bulk operations that the current MCP doesn't provide.

**Solution:** An enhanced Airtable MCP with advanced features for power users: formula evaluation, linked record resolution, attachment upload/download, and batch operations up to 10k records.

## Target User

- **Type:** Operations managers, project managers, no-code builders
- **Technical Level:** Semi-technical (comfortable with Airtable formulas)
- **Company Size:** Small team to SMB (5-100 people)
- **Pain Points:**
  - Basic MCP can't handle linked records properly
  - No attachment support in existing MCP
  - Batch operations limited or missing
  - Formula fields not evaluated correctly
- **Current Workarounds:**
  - Using Zapier/Make alongside Airtable
  - Manual copy/paste for complex operations
  - Multiple API calls for linked records

## Core Features (MVP)

### 1. Enhanced Query with Linked Records
Query tables with automatic resolution of linked records.

**Acceptance Criteria:**
- [ ] Fetch records with optional linked record expansion
- [ ] Configurable depth (1-2 levels of links)
- [ ] Include formula field computed values
- [ ] Support all Airtable filter syntax

### 2. Attachment Handling
Upload and download file attachments.

**Acceptance Criteria:**
- [ ] Upload files to attachment fields
- [ ] Download attachments with signed URLs
- [ ] Support multiple attachments per field
- [ ] Handle images, PDFs, and common file types

### 3. Bulk Operations
Create, update, or delete records in batches.

**Acceptance Criteria:**
- [ ] Batch create up to 10 records per API call (Airtable limit)
- [ ] Batch update with partial field updates
- [ ] Batch delete with confirmation
- [ ] Transaction-like rollback on partial failure

### 4. Schema & Formula Introspection
Get table schema including formula definitions.

**Acceptance Criteria:**
- [ ] List all fields with types
- [ ] Include formula expressions for formula fields
- [ ] Show linked table relationships
- [ ] Include select field options

### 5. View Support
Query specific views with their pre-defined filters/sorts.

**Acceptance Criteria:**
- [ ] List available views for a table
- [ ] Query records through a specific view
- [ ] Respect view's filter and sort settings
- [ ] Support grid, calendar, gallery views

## Differentiation

| Feature | Us | Smithery Basic | Zapier | Make |
|---------|----|----|--------|-----|
| Linked record resolution | Auto | Manual | Limited | Limited |
| Attachment handling | Full | None | Partial | Partial |
| Batch operations | 10k | 10 | Limited | Limited |
| Formula introspection | Yes | No | No | No |
| View support | Yes | No | No | Partial |
| MCP-native | Yes | Yes | No | No |

## Pricing Model (Smithery Remote MCP)

| Event Type | Price | Description |
|------------|-------|-------------|
| record-read | $0.001 | Per record retrieved |
| record-write | $0.003 | Per record created/updated |
| record-delete | $0.002 | Per record deleted |
| attachment-upload | $0.01 | Per file uploaded |
| attachment-download | $0.005 | Per file downloaded |
| schema-fetch | $0.002 | Per schema retrieval |

### Estimated User Costs

| User Type | Usage | Monthly Cost |
|-----------|-------|--------------|
| Light | 5k reads, 500 writes | ~$6.50 |
| Medium | 20k reads, 2k writes, 100 attachments | ~$28 |
| Heavy | 100k reads, 10k writes, 500 attachments | ~$140 |

*Competitive with Airtable's own $24/user pricing when considering value added.*

## Technical Requirements

### APIs/Integrations
- **Airtable API v0:** Records, tables, attachments
- **Airtable OAuth:** For user authentication
- **Cloudflare R2/S3:** For attachment staging (upload)

### Key Dependencies
- `airtable` - Official Airtable SDK
- `@modelcontextprotocol/sdk` - MCP server SDK
- File upload handling library

### Architecture Notes

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Claude    │────▶│  MCP Server      │────▶│  Airtable API   │
│   (Client)  │◀────│                  │◀────│                 │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │   R2/S3     │
                    │  (Staging)  │
                    └─────────────┘
```

### Airtable API Limits

- 5 requests per second per base
- 10 records per create/update batch
- 100 records per page (pagination required)

### Error Handling

| Error | Strategy |
|-------|----------|
| Rate limited (429) | Exponential backoff, queue requests |
| Invalid field | Return field-level validation errors |
| Record not found | Clear error with record ID |
| Attachment too large | Reject with size limit info |
| Permission denied | Check API key scopes |

## Success Metrics

- **3-Month Target:** 300 active users on Smithery
- **Monthly Events:** 500k record operations
- **Monthly Revenue:** ~$300 net

## MCP Tools Definition

```typescript
const tools = [
  {
    name: "airtable_query",
    description: "Query Airtable records with optional linked record expansion",
    inputSchema: {
      type: "object",
      properties: {
        base_id: { type: "string" },
        table_name: { type: "string" },
        filter_formula: { type: "string" },
        expand_links: { type: "boolean", default: false },
        link_depth: { type: "number", default: 1 },
        view: { type: "string" }
      },
      required: ["base_id", "table_name"]
    }
  },
  {
    name: "airtable_create_records",
    description: "Create one or more records in an Airtable table",
    inputSchema: {
      type: "object",
      properties: {
        base_id: { type: "string" },
        table_name: { type: "string" },
        records: { type: "array", items: { type: "object" } }
      },
      required: ["base_id", "table_name", "records"]
    }
  },
  {
    name: "airtable_update_records",
    description: "Update one or more existing records",
    inputSchema: {
      type: "object",
      properties: {
        base_id: { type: "string" },
        table_name: { type: "string" },
        records: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              fields: { type: "object" }
            }
          }
        }
      },
      required: ["base_id", "table_name", "records"]
    }
  },
  {
    name: "airtable_upload_attachment",
    description: "Upload a file to an attachment field",
    inputSchema: {
      type: "object",
      properties: {
        base_id: { type: "string" },
        table_name: { type: "string" },
        record_id: { type: "string" },
        field_name: { type: "string" },
        file_url: { type: "string" },
        filename: { type: "string" }
      },
      required: ["base_id", "table_name", "record_id", "field_name", "file_url"]
    }
  },
  {
    name: "airtable_get_schema",
    description: "Get table schema including field types and formulas",
    inputSchema: {
      type: "object",
      properties: {
        base_id: { type: "string" },
        table_name: { type: "string" }
      },
      required: ["base_id", "table_name"]
    }
  }
];
```

## Implementation Notes

1. **Start with enhanced query** - Most differentiated from basic MCP
2. **Add attachments second** - Clear gap in existing solution
3. **Batch operations** - High value for power users
4. **Compete on features, not price** - Existing MCP is already cheap

---

## Walkthrough: Reproducing the Linked Records Problem

### Step 1: Create a Test Base in Airtable

1. Go to https://airtable.com and create a new base
2. Create two tables:

**Table: Clients**
| Name | Email | Industry |
|------|-------|----------|
| Acme Corp | contact@acme.com | Technology |
| Beta Inc | hello@beta.io | Finance |
| Gamma LLC | info@gamma.co | Healthcare |

**Table: Projects**
| Project Name | Budget | Client (Linked) | Status |
|--------------|--------|-----------------|--------|
| Website Redesign | $50,000 | Acme Corp | Active |
| Mobile App | $120,000 | Beta Inc | Planning |
| Dashboard | $30,000 | Acme Corp | Complete |

3. The "Client" field in Projects is a **Linked Record** field pointing to the Clients table

### Step 2: Set Up the Current Smithery Airtable MCP

1. In Claude Desktop or Claude Code, add the MCP:
   ```json
   {
     "mcpServers": {
       "airtable": {
         "url": "https://server.smithery.ai/airtable/mcp"
       }
     }
   }
   ```

2. Authenticate with your Airtable API key (get from https://airtable.com/create/tokens)

3. Get your base ID (starts with `app...`) from the Airtable URL

### Step 3: Reproduce the Linked Record Problem

**Query the Projects table via Claude:**
```
Use the airtable MCP to list all records from the Projects table in base appXXXXXXXXXX
```

**What you get back (THE PROBLEM):**
```json
{
  "records": [
    {
      "id": "recABC123",
      "fields": {
        "Project Name": "Website Redesign",
        "Budget": 50000,
        "Client": ["recXYZ789"],  // <-- JUST THE RECORD ID!
        "Status": "Active"
      }
    },
    {
      "id": "recDEF456",
      "fields": {
        "Project Name": "Mobile App",
        "Budget": 120000,
        "Client": ["recUVW321"],  // <-- USELESS WITHOUT ANOTHER QUERY
        "Status": "Planning"
      }
    }
  ]
}
```

**What you WANT:**
```json
{
  "records": [
    {
      "id": "recABC123",
      "fields": {
        "Project Name": "Website Redesign",
        "Budget": 50000,
        "Client": {
          "id": "recXYZ789",
          "Name": "Acme Corp",           // <-- RESOLVED!
          "Email": "contact@acme.com",   // <-- EXPANDED!
          "Industry": "Technology"
        },
        "Status": "Active"
      }
    }
  ]
}
```

### Step 4: Current Workaround (Manual N+1 Queries)

To get client names with the current MCP, you must:

1. Query Projects table → get record IDs `["recXYZ789", "recUVW321"]`
2. Query Clients table with filter `RECORD_ID() = 'recXYZ789'`
3. Query Clients table with filter `RECORD_ID() = 'recUVW321'`
4. Manually join the data in your head or via Claude

**For 100 projects with clients = 101 API calls minimum**

### Step 5: What Our Solution Does

With `expand_links: true`:

```
Use airtable_query on Projects with expand_links=true
```

**Single call returns:**
```json
{
  "records": [
    {
      "id": "recABC123",
      "fields": {
        "Project Name": "Website Redesign",
        "Budget": 50000,
        "Client": {
          "_linked": true,
          "_table": "Clients",
          "id": "recXYZ789",
          "Name": "Acme Corp",
          "Email": "contact@acme.com",
          "Industry": "Technology"
        },
        "Status": "Active"
      }
    }
  ],
  "_meta": {
    "linked_records_resolved": 3,
    "api_calls_made": 2,
    "api_calls_saved": 99
  }
}
```

### The Airtable API Limitation (Root Cause)

From Airtable's official documentation:
> "The only thing you see in the field with the link is the AT record identifier like `['recPKTGm6EPiDoS6g']`. No data from the linked record is present."

> "If you'd like to retrieve the record from the other table, you would make another request for that record."

**Airtable has said they "may offer an option in the future to expand linked records" but it doesn't exist yet (as of Nov 2025).**

### Workaround People Use Today

1. **Formula field hack:** Create a formula `{Client Name}` that references the linked field - this returns text but loses the record ID
2. **Rollup field hack:** Create a rollup of RECORD_ID() from linked table - requires schema changes
3. **Multiple API calls:** Query each linked record separately - slow and expensive
4. **Denormalization:** Copy data into the main table - defeats the purpose of linked records

---

## Walkthrough: Attachment Handling Gap

### The Problem

1. Create a Projects table with an "Contract" attachment field
2. Upload a PDF contract via Airtable UI
3. Query via MCP:

```json
{
  "fields": {
    "Contract": [
      {
        "id": "attABC123",
        "url": "https://dl.airtable.com/.../contract.pdf",
        "filename": "contract.pdf",
        "size": 245632,
        "type": "application/pdf"
      }
    ]
  }
}
```

**You can READ attachment metadata, but the current MCP cannot:**
- Upload new attachments
- Download attachment contents
- Replace or delete attachments

### Our Solution

```typescript
// Upload
await airtable_upload_attachment({
  base_id: "appXXX",
  table_name: "Projects",
  record_id: "recABC",
  field_name: "Contract",
  file_url: "https://example.com/new-contract.pdf"
});

// Download (returns base64 or stream)
await airtable_download_attachment({
  attachment_id: "attABC123"
});
```

---

## References

- Validation evidence: `outputs/validate/validated-opportunities-2025-11-25.json`
- Airtable API docs: https://airtable.com/developers/web/api
- Existing Smithery MCP: https://smithery.ai/server/airtable
- Airtable Community on linked records: https://community.airtable.com/t5/development-apis/how-to-get-linked-record-data-using-the-rest-api/td-p/134328
