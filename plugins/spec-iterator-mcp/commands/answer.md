---
description: Provide answers to clarifying questions in an active session
---

# ANSWER - Respond to Clarifying Questions

Provide answers to clarifying questions and receive updated completeness scores and follow-up questions.

## Parameters

- `--session`: Session ID (required)
- `--interactive`: Run in interactive mode (default: true)

## Process

Use the `question-generator` agent to:

1. **Load Session State**
   - Retrieve session from `outputs/sessions/{session_id}.json`
   - Get pending questions
   - Load current completeness scores

2. **Collect Answers**
   - Present pending questions
   - Accept answers (interactive or provided)
   - Validate answer quality

3. **Update Session**
   - Record answers with timestamps
   - Mark questions as answered

4. **Recalculate Completeness**
   - Assess new information
   - Update category scores
   - Calculate overall completeness

5. **Generate Follow-up Questions** (if needed)
   - If completeness < threshold AND round < maxRounds
   - Generate new questions targeting gaps
   - Increment round counter

6. **Save Session**
   - Persist updated state
   - Update status if complete

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
  "status": "in_progress",
  "round": 2,
  "message": "More clarification needed. Please answer the following questions.",
  "pending_questions": [
    {
      "id": "q5",
      "question": "What data refresh frequency is needed?",
      "category": "technical",
      "priority": "important"
    }
  ]
}
```

## Usage

### Interactive mode
```
/spec-iterator:answer --session abc123-def456
```

Then answer each question when prompted.

### After answering
If `completeness.overall >= 80`:
```
Ready to generate! Run /spec-iterator:generate --session abc123-def456
```

If still in progress:
```
Continue with more answers or run /spec-iterator:gaps --session abc123-def456
```

## Answer Guidelines

For best results:
- Be specific, not vague
- Include concrete examples
- Mention constraints explicitly
- If unknown, say "unknown - assume X" to document assumption

## Handling Special Cases

### "I don't know"
If you don't know an answer:
- Document as assumption
- Suggest a reasonable default
- Flag for stakeholder follow-up

### Contradictory Answers
If a new answer contradicts a previous one:
- System will flag the conflict
- Ask for resolution
- Update both if needed

### Very Long Answers
Long answers are accepted but will be:
- Summarized for completeness scoring
- Preserved in full in session
