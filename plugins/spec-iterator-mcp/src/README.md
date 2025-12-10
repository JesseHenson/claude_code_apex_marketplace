# Spec Iterator

Transform rough requirements into complete technical specifications through AI-powered clarification dialogues.

## The Problem

"Build a dashboard for sales" becomes 2 weeks of rework when stakeholders realize the "obvious" pipeline view is missing. Requirements arrive incomplete, ambiguous, and full of hidden assumptions.

## The Solution

Spec Iterator conducts structured multi-turn clarification sessions that systematically uncover gaps before you write a single line of code.

## Features

- **Intelligent Requirement Analysis** - Identifies ambiguities, missing details, and implicit assumptions
- **Targeted Clarifying Questions** - 3-5 high-impact questions per round
- **Completeness Scoring** - Track progress across Functional, Technical, UX, Edge Cases, and Constraints
- **Gap Analysis** - See what's missing and understand the impact
- **Structured Output** - Generate specs with acceptance criteria in Markdown or JSON

## Configuration

Requires your Anthropic API key:

```json
{
  "ANTHROPIC_API_KEY": "sk-ant-..."
}
```

## Tools

| Tool | Description |
|------|-------------|
| `spec_start_session` | Start clarification from a rough requirement |
| `spec_answer_questions` | Provide answers, get follow-up questions |
| `spec_get_gaps` | Analyze what's missing |
| `spec_generate` | Generate final specification |
| `spec_get_status` | Check session status |
| `spec_list_sessions` | List active sessions |

## Example

```
Input: "We need order tracking for customers"

Round 1: Who are the users? What stages? Notifications?
Round 2: Which channels? Real-time? Returns?
Round 3: Completeness 82% - Generate!

Output: Complete spec with features, acceptance criteria, edge cases
```

## Development

```bash
npm install
npm run dev    # Uses @smithery/cli
npm run build  # Build for deployment
```

## License

MIT
