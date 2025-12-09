---
description: Get detailed gap analysis and completeness breakdown for a session
---

# GAPS - Analyze Missing Information

Perform detailed gap analysis on a session to understand what information is still missing and its impact.

## Parameters

- `--session`: Session ID (required)
- `--verbose`: Include detailed recommendations (default: false)

## Process

Use the `gap-analyzer` agent to:

1. **Load Session**
   - Retrieve current session state
   - Get all clarifications (answered and pending)

2. **Categorize Gaps**
   - Group missing info by category
   - Assess impact of each gap
   - Identify dependencies between gaps

3. **Generate Analysis**
   - Completeness breakdown by category
   - Critical gaps that block progress
   - Gaps that can be assumed
   - Recommendations for resolution

4. **Output Report**
   - Structured gap analysis
   - Prioritized action items

## Output

```json
{
  "success": true,
  "session_id": "abc123-def456",
  "completeness": {
    "overall": 65,
    "functional": 80,
    "technical": 60,
    "ux": 50,
    "edgeCases": 55,
    "constraints": 70
  },
  "gaps": [
    {
      "category": "technical",
      "description": "Data refresh frequency not specified",
      "priority": "important",
      "consequence": "May build real-time when batch is sufficient, impacting cost"
    },
    {
      "category": "ux",
      "description": "Mobile experience not discussed",
      "priority": "nice_to_have",
      "consequence": "May need to retrofit responsive design later"
    }
  ],
  "recommendations": [
    "Clarify data freshness requirements with stakeholder",
    "Document mobile as 'v2' if not critical for MVP",
    "Assume standard web-only for initial release"
  ]
}
```

## Gap Categories

### Functional Gaps
- Missing user personas
- Unclear feature scope
- Undefined business rules
- Missing success criteria

### Technical Gaps
- Unknown integrations
- Undefined data models
- Missing API requirements
- Unclear performance needs

### UX Gaps
- Missing user flows
- Undefined error states
- Unclear navigation
- Missing accessibility requirements

### Edge Case Gaps
- Unhandled error scenarios
- Missing boundary conditions
- Unclear failure modes
- Missing recovery procedures

### Constraint Gaps
- Unknown budget
- Unclear timeline
- Missing compliance requirements
- Undefined scalability needs

## Usage

### Basic gap check
```
/spec-iterator:gaps --session abc123-def456
```

### With recommendations
```
/spec-iterator:gaps --session abc123-def456 --verbose
```

## Next Steps

Based on gap analysis:
- Answer critical gaps: `/spec-iterator:answer --session {id}`
- Document as assumptions: Note in session
- Generate spec anyway: `/spec-iterator:generate --session {id}` (will include gaps as open questions)
