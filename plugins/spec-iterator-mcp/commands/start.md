---
description: Start a new spec clarification session from a rough requirement
---

# START - Initialize Clarification Session

Start a new clarification session by analyzing a rough requirement and generating initial questions.

## Parameters

- `--requirement`: The requirement text (required)
- `--domain`: Domain context (e.g., "e-commerce", "healthcare", "SaaS")
- `--audience`: Target audience ("technical", "business", "mixed")
- `--template`: Template to use ("generic", "api", "ui-feature", "integration", "migration")
- `--name`: Session name (auto-generated if not provided)

## Process

Use the `requirement-analyzer` agent to:

1. **Parse Requirement**
   - Extract entities and relationships
   - Identify actors/users mentioned
   - Detect domain-specific terms

2. **Analyze for Gaps**
   - Check for missing functional details
   - Identify technical unknowns
   - Flag UX considerations needed
   - Note missing edge cases
   - List undefined constraints

3. **Generate Initial Questions**
   - Create 3-5 targeted questions
   - Prioritize by criticality
   - Categorize by gap type
   - Order by dependency

4. **Initialize Session**
   - Generate session ID
   - Calculate initial completeness scores
   - Save to `outputs/sessions/{session_id}.json`

## Output

Returns:
- Session ID for subsequent operations
- Initial completeness assessment
- First round of clarifying questions

```json
{
  "success": true,
  "session_id": "abc123-def456",
  "message": "Session started. Please answer the following questions.",
  "completeness": {
    "overall": 18,
    "functional": 20,
    "technical": 15,
    "ux": 15,
    "edgeCases": 10,
    "constraints": 20
  },
  "questions": [
    {
      "id": "q1",
      "question": "Who specifically will use this feature?",
      "category": "functional",
      "priority": "critical"
    }
  ],
  "round": 1
}
```

## Usage

### Basic
```
/spec-iterator:start --requirement "We need a dashboard for our sales team"
```

### With context
```
/spec-iterator:start --requirement "Payment processing feature" --domain fintech --audience technical
```

### With template
```
/spec-iterator:start --requirement "REST API for user management" --template api
```

## Next Command

Continue with:
```
/spec-iterator:answer --session {session_id}
```
