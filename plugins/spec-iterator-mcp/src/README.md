# Spec Iterator MCP Server

Transform rough ideas into complete technical specifications through structured multi-turn clarification dialogues.

## Features

- **Requirement Analysis**: Parses vague requirements and identifies gaps
- **Clarifying Questions**: Generates targeted questions to improve spec quality
- **Completeness Tracking**: Scores specs across functional, technical, UX, edge cases, and constraints
- **Gap Analysis**: Shows what's missing and the impact
- **Spec Generation**: Outputs structured specifications with acceptance criteria

## Installation

### Local Development

```bash
cd src
npm install
npm run build
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spec-iterator": {
      "command": "node",
      "args": ["/path/to/spec-iterator-mcp/src/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Smithery Deployment

1. Push to GitHub
2. Connect repo to Smithery
3. Deploy with `smithery.yaml` configuration

## Tools

### spec_start_session

Start a new clarification session from a rough requirement.

**Input:**
```json
{
  "requirement": "We need a dashboard for our sales team",
  "domain": "SaaS",
  "audience": "business"
}
```

**Output:** Session ID + initial clarifying questions

### spec_answer_questions

Provide answers to clarifying questions.

**Input:**
```json
{
  "session_id": "abc123",
  "answers": [
    { "question_id": "q1_1", "answer": "Sales managers and reps" },
    { "question_id": "q1_2", "answer": "Track revenue and pipeline" }
  ]
}
```

**Output:** Updated completeness + follow-up questions

### spec_get_gaps

Analyze gaps and get recommendations.

**Input:**
```json
{
  "session_id": "abc123"
}
```

**Output:** Gap analysis by category with impact and recommendations

### spec_generate

Generate the final specification.

**Input:**
```json
{
  "session_id": "abc123",
  "format": "markdown"
}
```

**Output:** Complete structured specification

### spec_get_status

Check session status and pending questions.

### spec_list_sessions

List all active sessions.

## Pricing (Smithery)

| Tool | Price per call |
|------|----------------|
| spec_start_session | $0.02 |
| spec_answer_questions | $0.02 |
| spec_get_gaps | $0.01 |
| spec_generate | $0.05 |
| spec_get_status | Free |
| spec_list_sessions | Free |

**Typical spec cost:** $0.10-0.20 (2-4 rounds of Q&A + generation)

## How It Works

1. **Start**: User provides rough requirement
2. **Analyze**: LLM identifies gaps and generates clarifying questions
3. **Iterate**: User answers questions, system generates follow-ups
4. **Score**: Completeness tracked by category (functional, technical, UX, edge cases, constraints)
5. **Generate**: When completeness reaches threshold (80%), generate full spec

## Environment Variables

- `ANTHROPIC_API_KEY` - Required. Your Anthropic API key.

## License

MIT
