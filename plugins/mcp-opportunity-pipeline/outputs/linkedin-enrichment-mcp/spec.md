# MCP Server Spec: LinkedIn Profile Enrichment

## Overview

**Problem:** No LinkedIn MCP exists. Sales/recruiting teams using Claude need to context-switch to expensive tools (PhantomBuster $56+/mo, Evaboot $49+/mo) that break frequently due to LinkedIn's anti-bot measures.

**Solution:** An MCP server for Claude-native LinkedIn profile lookups with intelligent caching, multi-source enrichment, and compliance-focused design.

## Target User

- **Type:** Sales reps, recruiters, founders doing outreach
- **Technical Level:** Non-technical to semi-technical
- **Company Size:** Solo to SMB (1-50 people)
- **Pain Points:**
  - Expensive LinkedIn scraping tools ($50-500/mo)
  - Tools break frequently due to LinkedIn blocks
  - No Claude/MCP integration
  - Manual profile research is time-consuming
- **Current Workarounds:**
  - PhantomBuster, Evaboot, Bardeen
  - Manual LinkedIn browsing
  - Paying for Sales Navigator + third-party tools

## Core Features (MVP)

### 1. Profile Lookup
Get LinkedIn profile data by URL or name+company.

**Acceptance Criteria:**
- [ ] Accept LinkedIn URL or name + company combo
- [ ] Return structured profile data (name, title, company, location, summary)
- [ ] Cache results to reduce API calls
- [ ] Handle private profiles gracefully

### 2. Company Lookup
Get company information from LinkedIn company page.

**Acceptance Criteria:**
- [ ] Accept company LinkedIn URL or company name
- [ ] Return company size, industry, location, description
- [ ] Include employee count ranges
- [ ] Cache company data (longer TTL than profiles)

### 3. Email Enrichment (via third-party)
Enrich profiles with email addresses using Hunter, Clearbit, or similar.

**Acceptance Criteria:**
- [ ] Optional email lookup (user provides API key)
- [ ] Support multiple enrichment providers
- [ ] Return confidence score for emails
- [ ] Respect enrichment provider rate limits

### 4. Batch Lookup
Process multiple profiles in a single request.

**Acceptance Criteria:**
- [ ] Accept list of URLs or name+company pairs
- [ ] Process in parallel with rate limiting
- [ ] Return partial results on failures
- [ ] Progress tracking for large batches

## Differentiation

| Feature | Us | PhantomBuster | Evaboot | Bardeen |
|---------|----|----|--------|-----|
| MCP-native | Yes | No | No | No |
| Claude integration | Native | None | None | Limited |
| Pricing | PPE | $56+/mo | $49+/mo | $10+/mo |
| Anti-block handling | Multi-source | Single | Single | Single |
| Email enrichment | Integrated | Separate | Built-in | Separate |

## Pricing Model (Smithery Remote MCP)

| Event Type | Price | Description |
|------------|-------|-------------|
| profile-lookup | $0.05 | Per profile retrieved |
| company-lookup | $0.03 | Per company retrieved |
| email-enrich | $0.10 | Per email found (pass-through + margin) |
| batch-lookup | $0.04 | Per profile in batch (volume discount) |

### Estimated User Costs

| User Type | Usage | Monthly Cost |
|-----------|-------|--------------|
| Light | 50 profiles, 20 companies | ~$4 |
| Medium | 200 profiles, 50 companies, 100 emails | ~$23 |
| Heavy | 1k profiles, 200 companies, 500 emails | ~$100 |

*Significantly cheaper than PhantomBuster ($56+) for light/medium users.*

## Technical Requirements

### APIs/Integrations
- **Proxycurl API:** LinkedIn data (primary source)
- **RocketReach/Hunter/Clearbit:** Email enrichment
- **Google Search API:** Fallback for public profiles

### Key Dependencies
- `@modelcontextprotocol/sdk` - MCP server SDK
- HTTP client with proxy support
- Redis/Upstash for caching

### Architecture Notes

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Claude    │────▶│  MCP Server      │────▶│  Proxycurl API  │
│   (Client)  │◀────│  (Cached)        │◀────│  (Primary)      │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │                         │
                    ┌──────┴──────┐          ┌───────┴───────┐
                    │   Cache     │          │ Email Enrich  │
                    │  (Redis)    │          │ (Hunter, etc) │
                    └─────────────┘          └───────────────┘
```

### Rate Limit Handling

- Cache profiles for 24 hours
- Cache companies for 7 days
- Respect Proxycurl limits (based on plan)
- Queue batch requests

### Error Handling

| Error | Strategy |
|-------|----------|
| Profile not found | Return null, don't charge |
| Private profile | Return available public data only |
| Rate limited | Queue and retry, notify user of delay |
| Enrichment fail | Return profile without email |

## Risk Factors

1. **LinkedIn TOS:** Tool operates in gray area - emphasize "enrichment" not "scraping"
2. **Data freshness:** Cached data may be stale
3. **Proxy costs:** Need reliable proxy infrastructure
4. **Third-party dependency:** Proxycurl pricing/availability

## Success Metrics

- **3-Month Target:** 200 active users on Smithery
- **Monthly Events:** 10k profile lookups
- **Monthly Revenue:** ~$500 net

## Implementation Notes

1. **Use Proxycurl** - Handles LinkedIn complexity, we just wrap it
2. **Heavy caching** - Reduce costs, improve speed
3. **User-provided API keys** - For email enrichment, reduce our liability
4. **Compliance messaging** - Clear terms about acceptable use

---

## Walkthrough: Reproducing the LinkedIn Data Problem

### Step 1: The Manual Research Process

**Current state for sales/recruiting:**

1. User receives a lead: "John Smith at Acme Corp"
2. Go to LinkedIn, search for "John Smith Acme Corp"
3. Find profile (hopefully the right one)
4. Manually copy: name, title, company, location, about section
5. Cross-reference with company page for company size, industry
6. Use a separate tool (Hunter.io) to find email
7. Paste all this into CRM or outreach tool

**Time per lead:** 3-5 minutes
**For 50 leads/day:** 2.5-4 hours of research

### Step 2: The Automation Tool Experience

**PhantomBuster workflow:**

1. Sign up at phantombuster.com ($56/month minimum)
2. Create a "LinkedIn Profile Scraper" phantom
3. Configure with LinkedIn session cookie (requires logging in, copying cookie)
4. Input list of LinkedIn URLs
5. Run the phantom

**What goes wrong:**

```
❌ Error: LinkedIn has blocked this session
   Reason: Unusual activity detected
   Solution: Wait 24-48 hours, get new session cookie
```

```
❌ Error: Rate limit exceeded
   Reason: Too many profile views in 24h
   Solution: Reduce speed, wait, or use multiple accounts
```

**From Reddit (r/sales, r/LinkedInSales):**
> "PhantomBuster worked great for 2 weeks, then my LinkedIn account got restricted"
> "I have to rotate through 3 accounts now just to scrape 100 profiles/day"
> "The session cookie expires every few days, so annoying"

### Step 3: Why Existing Tools Break

LinkedIn's anti-bot measures:

1. **Session-based tracking:** Cookies expire, get flagged
2. **Behavior analysis:** Fast sequential requests = bot
3. **IP reputation:** Known proxy/datacenter IPs blocked
4. **Request patterns:** Consistent timing = automated

**Tools like PhantomBuster try to:**
- Use your actual LinkedIn session (risky)
- Rotate proxies (expensive, still detectable)
- Simulate human behavior (inconsistent)

### Step 4: What Our Solution Does

**We use Proxycurl instead of scraping:**

```typescript
// Our approach - uses Proxycurl's official API
const profile = await mcpTool("linkedin_profile_lookup", {
  linkedin_url: "https://linkedin.com/in/johnsmith"
});

// Returns:
{
  "full_name": "John Smith",
  "headline": "VP of Sales at Acme Corp",
  "location": "San Francisco Bay Area",
  "summary": "15+ years in enterprise sales...",
  "experiences": [...],
  "education": [...],
  "skills": [...]
}
```

**Why Proxycurl is different:**
1. Has official data partnerships (not scraping)
2. Maintains data freshness through aggregation
3. No risk to your LinkedIn account
4. Consistent, reliable API

**Our value-add on top:**
- MCP-native (works directly in Claude)
- Heavy caching (24h for profiles, 7d for companies)
- Batch processing with progress
- Email enrichment integration (Hunter, Clearbit)

### Step 5: Before/After Comparison

**Before (Manual + PhantomBuster):**
```
User: I need info on these 50 leads
→ Upload to PhantomBuster
→ Wait 30 minutes
→ Hope it doesn't get blocked
→ Download CSV
→ Import to CRM
→ Separately run Hunter.io for emails
→ Merge data manually
```

**After (Our MCP):**
```
User: Look up these 50 LinkedIn profiles and find their emails

Claude: I'll use the LinkedIn enrichment MCP...

Progress: 10/50 profiles enriched
Progress: 25/50 profiles enriched
Progress: 50/50 profiles enriched

Found 47 profiles with emails.
Here's the summary:
[Structured results ready to use]
```

### The Compliance Consideration

**Important:** We position as "enrichment" not "scraping":
- We use Proxycurl's legitimate API
- Users bring their own API keys for email services
- Clear terms of service about acceptable use
- No LinkedIn login required = no account risk

This is how Apollo, Clearbit, and other legitimate sales intelligence tools operate.

---

## References

- Validation evidence: `outputs/validate/validated-opportunities-2025-11-25.json`
- Proxycurl API: https://nubela.co/proxycurl/
- Hunter API: https://hunter.io/api
- LinkedIn rate limits: https://www.linkedin.com/help/linkedin/answer/a1340567
