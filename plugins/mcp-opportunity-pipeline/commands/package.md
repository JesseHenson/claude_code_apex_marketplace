---
description: Generate documentation and marketing materials for publication
---

# Stage 7: PACKAGE

Generate documentation and marketing materials for marketplace publication.

## Prerequisites

- `outputs/build/{name}/` from Stage 5
- `outputs/spec/{name}-spec.md` from Stage 4
- `outputs/qa/{name}-qa-report.json` from Stage 6 (should be PASS)

## Parameters

Parse from user input:
- `--name`: Build name to package (required if multiple)
- `--target`: apify | smithery | npm (default: apify)

## Process

Use the `publisher` agent to:

1. **Load artifacts** from outputs directories

2. **Generate README.md:**

   ```markdown
   # {Actor Name}

   {Description from spec}

   ## Features
   - Feature 1
   - Feature 2
   - Feature 3

   ## Usage

   ### Input
   ```json
   {
     "param1": "value",
     "param2": 123
   }
   ```

   ### Output
   {Output schema and example}

   ## Pricing

   | Event | Cost | Description |
   |-------|------|-------------|
   | {event} | ${price} | {desc} |

   ## Examples

   ### Basic Usage
   {code example}

   ### Advanced Usage
   {code example}

   ## Changelog

   ### v0.1.0
   - Initial release
   ```

3. **Generate Apify Actor description** (SEO optimized):
   - Title with keywords
   - Feature highlights
   - Use cases
   - Pricing breakdown

4. **Generate marketing materials:**

   a. **Reddit launch post** (`marketing/reddit-post.md`):
      - r/SideProject format
      - Problem → Solution → Features → Link
      - No hard sell, community-friendly tone

   b. **Twitter/X thread** (`marketing/twitter-thread.md`):
      - Hook tweet
      - 3-5 feature tweets
      - Call to action

   c. **Marketplace listing** (`marketing/marketplace-listing.md`):
      - Full description
      - Keywords
      - Category suggestions

5. **Save** to `outputs/package/{name}/`

## Output Structure

```
outputs/package/{name}/
├── README.md
├── ACTOR_DESCRIPTION.md
├── marketing/
│   ├── reddit-post.md
│   ├── twitter-thread.md
│   └── marketplace-listing.md
└── assets/
    └── (placeholder for icons, screenshots)
```

## Marketing Templates

### Reddit Post Template
```markdown
# I built {name} - {one-liner description}

**The Problem:**
{Problem description from validation evidence}

**What I Built:**
{Solution summary}

**Key Features:**
- {Feature 1}
- {Feature 2}
- {Feature 3}

**Pricing:**
{Simple pricing explanation}

**Link:** {URL}

Would love feedback from the community!
```

### Twitter Thread Template
```markdown
Thread:

1/ Just shipped: {name}

{One-liner problem statement}

Here's what it does 🧵

2/ The problem:
{Problem in 280 chars}

3/ The solution:
{Feature 1}
{Feature 2}

4/ Built for {target user}
{Use case examples}

5/ Try it out:
{Link}

Feedback welcome!
```

## Next Step

Run `/mcp-pipeline:publish` to deploy to marketplace.
