---
description: Resume a previously started clarification session
---

# RESUME - Continue Previous Session

Resume a previously started clarification session to continue answering questions or generate the spec.

## Parameters

- `--session`: Session ID (required)
- `--list`: List all available sessions instead of resuming

## Process

1. **Load Session**
   - Retrieve session from `outputs/sessions/{session_id}.json`
   - Verify session exists
   - Check session status

2. **Display State**
   - Show original requirement
   - Display current completeness
   - List answered questions (summary)
   - Show pending questions

3. **Determine Next Action**
   - If `status: complete`: Session already done, can regenerate
   - If `status: ready_to_generate`: Ready for generate command
   - If `status: in_progress`: Continue with answer command

## Output

```json
{
  "success": true,
  "session_id": "abc123-def456",
  "status": "in_progress",
  "requirement": "We need a dashboard for our sales team",
  "context": {
    "domain": "SaaS",
    "audience": "business"
  },
  "completeness": {
    "overall": 65
  },
  "round": 2,
  "answered_count": 8,
  "pending_count": 4,
  "pending_questions": [
    {
      "id": "q9",
      "question": "What's the data refresh frequency requirement?",
      "category": "technical",
      "priority": "important"
    }
  ],
  "assumptions": [],
  "message": "Session resumed. Please answer the pending questions."
}
```

## Listing Sessions

```
/spec-iterator:resume --list
```

Output:
```json
{
  "sessions": [
    {
      "id": "abc123-def456",
      "requirement": "We need a dashboard...",
      "status": "in_progress",
      "completeness": 65,
      "updatedAt": "2025-12-09T14:30:00Z"
    },
    {
      "id": "xyz789-uvw012",
      "requirement": "User authentication...",
      "status": "complete",
      "completeness": 92,
      "updatedAt": "2025-12-08T10:15:00Z"
    }
  ]
}
```

## Usage

### Resume specific session
```
/spec-iterator:resume --session abc123-def456
```

### List all sessions
```
/spec-iterator:resume --list
```

## Session Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `in_progress` | Active, more questions to answer | `/spec-iterator:answer` |
| `ready_to_generate` | 80%+ complete, ready for spec | `/spec-iterator:generate` |
| `complete` | Spec already generated | Review or regenerate |

## Next Steps

After resume:
- Continue answering: `/spec-iterator:answer --session {id}`
- Check gaps: `/spec-iterator:gaps --session {id}`
- Generate spec: `/spec-iterator:generate --session {id}`
