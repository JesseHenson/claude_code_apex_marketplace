# Spec Iterator

[![smithery badge](https://smithery.ai/badge/@JesseHenson/claude_code_apex_marketplace)](https://smithery.ai/server/@JesseHenson/claude_code_apex_marketplace)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-green.svg)](https://nodejs.org)

Transform rough requirements into complete technical specifications through AI-powered clarification dialogues.

## The Problem

"Build a dashboard for sales" becomes 2 weeks of rework when stakeholders realize the "obvious" pipeline view is missing. Requirements arrive incomplete, ambiguous, and full of hidden assumptions.

## The Solution

Spec Iterator conducts structured multi-turn clarification sessions that systematically uncover gaps before you write a single line of code.

## Features

- **Intelligent Requirement Analysis** - Identifies ambiguities, missing details, and implicit assumptions
- **Targeted Clarifying Questions** - 3-5 high-impact questions per round, categorized by type
- **Completeness Scoring** - Track progress across Functional (30%), Technical (25%), UX (20%), Edge Cases (15%), and Constraints (10%)
- **Gap Analysis** - Understand what's missing and the impact of each gap
- **Structured Output** - Generate specs with acceptance criteria in Markdown or JSON

## Installation

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spec-iterator": {
      "command": "npx",
      "args": ["-y", "spec-iterator-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

### VS Code with Continue

Add to your Continue config:

```json
{
  "mcpServers": {
    "spec-iterator": {
      "command": "npx",
      "args": ["-y", "spec-iterator-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "spec-iterator": {
      "command": "npx",
      "args": ["-y", "spec-iterator-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

### Smithery (Hosted)

Deploy via [Smithery](https://smithery.ai) for a hosted solution without local installation.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com) |

## Tools

| Tool | Description |
|------|-------------|
| `spec_start_session` | Start clarification from a rough requirement |
| `spec_answer_questions` | Provide answers to clarifying questions |
| `spec_get_gaps` | Analyze what information is still missing |
| `spec_generate` | Generate the final specification document |
| `spec_get_status` | Check session progress and pending questions |
| `spec_list_sessions` | List all active and completed sessions |
| `spec_info` | Server health check and diagnostics |

## Usage Example

### Typical Workflow

```
1. Start a session with your rough requirement
   → spec_start_session("We need order tracking for customers")

2. Answer the clarifying questions (3-5 per round)
   → spec_answer_questions(session_id, answers)

3. Repeat until completeness reaches 80%+
   → Check progress with spec_get_status(session_id)

4. Generate your specification
   → spec_generate(session_id, format="markdown")
```

### Sample Session

**Input:**
```
"We need order tracking for customers"
```

**Round 1 Questions:**
- Who are the primary users - end customers or support reps?
- What order stages should be visible?
- Should users receive proactive notifications?

**Round 2 Questions:**
- Which notification channels (email, SMS, push)?
- Real-time tracking requirements?
- How should returns be handled?

**Output (at 82% completeness):**
- Problem statement with user personas
- Step-by-step user flow
- MVP features with acceptance criteria
- Edge cases and error handling
- Documented assumptions for stakeholder review

## Completeness Categories

| Category | Weight | Focus |
|----------|--------|-------|
| Functional | 30% | What the system does |
| Technical | 25% | How it's built |
| UX | 20% | User experience |
| Edge Cases | 15% | Error handling |
| Constraints | 10% | Business limits |

## API Cost Estimate

Typical specification generation costs $0.05-0.15 in API calls (3-5 clarification rounds using Claude Sonnet).

## Development

```bash
# Install dependencies
npm install

# Run locally with Smithery CLI
npm run dev

# Build for deployment
npm run build
```

## Repository

[GitHub](https://github.com/JesseHenson/claude_code_apex_marketplace)

## License

MIT - see [LICENSE](./LICENSE)

## Author

Jesse Henson