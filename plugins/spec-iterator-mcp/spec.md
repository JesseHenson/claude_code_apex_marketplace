# MCP Server Spec: Spec Iterator

## Overview

**Problem:** Product managers and developers waste hours going back-and-forth with stakeholders to refine vague requirements into buildable specs. Initial requirements are often incomplete, ambiguous, or missing critical edge cases. Current workflow involves scattered Slack threads, Google Docs comments, and meeting notes that never get synthesized.

**Solution:** An MCP server that conducts structured multi-turn clarification dialogues to transform rough ideas into complete technical specifications with acceptance criteria, automatically tracking what's been clarified and what gaps remain.

## Target User

- **Type:** Product managers, tech leads, solo developers, startup founders
- **Technical Level:** Mixed (tool adapts questioning to audience)
- **Company Size:** Solo to mid-size teams (1-50 people)
- **Pain Points:**
  - Requirements arrive incomplete ("build a dashboard")
  - Stakeholders don't know what they don't know
  - Specs get built on assumptions that turn out wrong
  - No systematic way to ensure completeness
- **Current Workarounds:**
  - Manual checklists of questions to ask
  - Multiple meetings to clarify requirements
  - Building first, fixing requirements later
  - PRD templates that get filled in inconsistently

## Core Features (MVP)

### 1. Clarification Session
Start an interactive spec refinement session from a rough idea.

**Acceptance Criteria:**
- [ ] Accept initial requirement text (1 sentence to 1 page)
- [ ] Analyze for ambiguities, gaps, and implicit assumptions
- [ ] Generate targeted clarifying questions (3-5 per round)
- [ ] Track answered vs. unanswered questions
- [ ] Support multi-turn conversation until spec is complete

### 2. Gap Analysis
Identify what's missing from a requirement.

**Acceptance Criteria:**
- [ ] Categorize gaps: functional, technical, UX, edge cases, constraints
- [ ] Score completeness (0-100%) with breakdown by category
- [ ] Highlight critical vs. nice-to-have gaps
- [ ] Suggest what happens if gap isn't addressed

### 3. Spec Generation
Transform clarified requirements into structured specification.

**Acceptance Criteria:**
- [ ] Output structured spec with: problem, user flow, I/O contracts, edge cases, MVP scope
- [ ] Include acceptance criteria per feature
- [ ] Flag any remaining ambiguities as "assumptions"
- [ ] Support multiple output formats (Markdown, JSON, YAML)

### 4. Session Persistence
Save and resume clarification sessions.

**Acceptance Criteria:**
- [ ] Save session state (questions asked, answers received, current gaps)
- [ ] Resume from checkpoint
- [ ] Export conversation history
- [ ] Merge input from multiple stakeholders

## Differentiation

| Feature | Us | ChatGPT/Claude Direct | Notion AI | Linear |
|---------|----|-----------------------|-----------|--------|
| Structured iteration | Systematic | Ad-hoc | None | None |
| Gap tracking | Automatic | Manual | None | None |
| Completeness scoring | Yes | No | No | No |
| Session persistence | Yes | Limited | No | No |
| Output format | Structured spec | Prose | Prose | Issue |
| Domain templates | Yes | Generic | Generic | Generic |

## Pricing Model (Smithery Remote MCP)

| Event Type | Price | Description |
|------------|-------|-------------|
| mcp-connect | $0.00 | Connection setup (free) |
| session-start | $0.01 | Start new clarification session |
| clarification-round | $0.02 | Per round of Q&A |
| gap-analysis | $0.01 | Per gap analysis run |
| spec-generate | $0.05 | Generate final spec document |

### Estimated User Costs

| User Type | Usage | Monthly Cost |
|-----------|-------|--------------|
| Light | 5 specs/month | ~$2 |
| Medium | 20 specs/month | ~$8 |
| Heavy | 50 specs/month | ~$20 |

## Technical Requirements

### Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Claude    │────▶│  Spec Iterator MCP   │────▶│  LLM API    │
│   (Client)  │◀────│                      │◀────│  (Analysis) │
└─────────────┘     └──────────────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Session   │
                    │   Store     │
                    └─────────────┘
```

### Key Components

1. **Requirement Analyzer** - Parses input, identifies entities, relationships, ambiguities
2. **Question Generator** - Creates targeted clarifying questions based on gaps
3. **Gap Tracker** - Maintains state of what's known vs. unknown
4. **Spec Compiler** - Transforms clarified requirements into structured output
5. **Session Manager** - Handles persistence and multi-stakeholder merging

### Key Dependencies
- `@modelcontextprotocol/sdk` - MCP server SDK
- `zod` - Schema validation for specs
- Local storage or Redis for session persistence

### Data Flow

```
Input Requirement
       │
       ▼
┌──────────────┐
│   Analyze    │──▶ Identify gaps, ambiguities
└──────────────┘
       │
       ▼
┌──────────────┐
│  Generate    │──▶ Clarifying questions
│  Questions   │
└──────────────┘
       │
       ▼
┌──────────────┐
│   Receive    │──▶ Update knowledge state
│   Answers    │
└──────────────┘
       │
       ▼
  Completeness < 80%? ──▶ Loop back to Generate Questions
       │
       ▼ (when complete)
┌──────────────┐
│   Compile    │──▶ Structured specification
│    Spec      │
└──────────────┘
```

## Input/Output Contracts

### Start Session Input
```typescript
interface StartSessionInput {
  requirement: string;           // Raw requirement text
  context?: {
    domain?: string;             // e.g., "e-commerce", "healthcare"
    audience?: "technical" | "business" | "mixed";
    existingDocs?: string[];     // URLs or text of related docs
  };
  templateId?: string;           // Use predefined spec template
}
```

### Session State
```typescript
interface SessionState {
  id: string;
  createdAt: string;
  requirement: string;
  clarifications: Array<{
    question: string;
    answer: string | null;
    category: "functional" | "technical" | "ux" | "edge_case" | "constraint";
    priority: "critical" | "important" | "nice_to_have";
  }>;
  completeness: {
    overall: number;           // 0-100
    functional: number;
    technical: number;
    ux: number;
    edgeCases: number;
    constraints: number;
  };
  assumptions: string[];       // Gaps filled with assumptions
  status: "in_progress" | "ready_to_generate" | "complete";
}
```

### Generated Spec Output
```typescript
interface GeneratedSpec {
  title: string;
  problemStatement: {
    pain: string;
    who: string;
    currentWorkarounds: string[];
  };
  userFlow: Array<{
    step: number;
    actor: string;
    action: string;
    outcome: string;
  }>;
  features: Array<{
    name: string;
    description: string;
    acceptanceCriteria: string[];
    priority: "mvp" | "v2" | "future";
  }>;
  inputOutputContracts: {
    inputs: Record<string, { type: string; required: boolean; description: string }>;
    outputs: Record<string, { type: string; description: string }>;
  };
  edgeCases: Array<{
    scenario: string;
    handling: string;
  }>;
  assumptions: string[];
  openQuestions: string[];
}
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Requirement too vague | Start with high-level scoping questions before details |
| Contradictory answers | Flag conflict, ask for resolution |
| Stakeholder says "just figure it out" | Document as assumption, continue |
| Domain-specific jargon | Ask for clarification, build glossary |
| Session abandoned mid-way | Auto-save, allow resume anytime |
| Multiple stakeholders disagree | Track conflicting answers, escalate |

## MVP Scope

### Ships First (MVP)
1. Single-session clarification flow
2. Gap analysis with completeness scoring
3. Markdown spec output
4. Basic templates (generic, API, UI feature)

### Ships Later (v2)
- Multi-stakeholder collaboration
- Custom template builder
- Integration with Jira/Linear for direct issue creation
- Historical pattern learning ("you usually forget X")
- Diagram generation (user flow, architecture)

## Success Criteria

- **Completeness Improvement:** Specs generated have 50% fewer clarification requests during implementation
- **Time Saved:** Average spec creation time reduced from 2+ hours to 30 minutes
- **User Satisfaction:** >4.0 rating on "spec clarity" from developers receiving specs
- **3-Month Target:** 200 active users, 1000 specs generated

## MCP Tools Definition

```typescript
const tools = [
  {
    name: "spec_start_session",
    description: "Start a new spec clarification session from a rough requirement",
    inputSchema: {
      type: "object",
      properties: {
        requirement: { type: "string", description: "The initial requirement or idea" },
        domain: { type: "string", description: "Domain context (e.g., 'e-commerce', 'healthcare')" },
        audience: { type: "string", enum: ["technical", "business", "mixed"] },
        template: { type: "string", description: "Template ID to use" }
      },
      required: ["requirement"]
    }
  },
  {
    name: "spec_answer_questions",
    description: "Provide answers to clarifying questions in the current session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
        answers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question_id: { type: "string" },
              answer: { type: "string" }
            }
          }
        }
      },
      required: ["session_id", "answers"]
    }
  },
  {
    name: "spec_get_gaps",
    description: "Get current gaps and completeness score for a session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" }
      },
      required: ["session_id"]
    }
  },
  {
    name: "spec_generate",
    description: "Generate the final structured specification",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
        format: { type: "string", enum: ["markdown", "json", "yaml"], default: "markdown" },
        include_assumptions: { type: "boolean", default: true }
      },
      required: ["session_id"]
    }
  },
  {
    name: "spec_resume_session",
    description: "Resume a previously started session",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string" }
      },
      required: ["session_id"]
    }
  }
];
```

## Implementation Notes

1. **Start with conversation loop** - Core value is the iterative Q&A
2. **Question quality is everything** - Invest in prompt engineering for targeted questions
3. **Don't over-engineer persistence** - File-based storage is fine for MVP
4. **Templates drive adoption** - Build 3-5 good templates for common spec types

---

## Walkthrough: Reproducing the Incomplete Spec Problem

### Step 1: The Typical Scenario

**Stakeholder sends:** "We need a dashboard for our sales team"

**What's missing:**
- Which metrics? Revenue? Pipeline? Activity?
- What time periods? Daily? Weekly? YTD?
- Who can see what? Are there permission levels?
- Real-time or refreshed periodically?
- Mobile support needed?
- Integration with existing tools?

### Step 2: What Happens Today

Developer builds based on assumptions:
1. Assumes "revenue by month" is the key metric
2. Ships dashboard with bar charts
3. Stakeholder: "Where's the pipeline view?"
4. Developer: "You didn't mention pipeline"
5. Stakeholder: "I assumed that was obvious"
6. 2 weeks of rework

### Step 3: With Spec Iterator

**Input:** "We need a dashboard for our sales team"

**Round 1 Questions:**
1. Who specifically will use this dashboard? (Roles/personas)
2. What are the top 3 decisions this dashboard should help make?
3. What data sources exist today? (CRM, spreadsheets, etc.)
4. Are there existing reports that should be replicated or replaced?

**Round 2 Questions (after answers):**
1. You mentioned CRM - which CRM? What fields are available?
2. For the pipeline view, what stages should be tracked?
3. Should managers see team aggregate or individual rep data?
4. What's the refresh frequency requirement?

**Round 3:**
- Completeness: 78%
- Missing: Mobile requirements, export needs, alerting

**Final Spec Generated:**
- Clear feature list with acceptance criteria
- Data model defined
- Permissions matrix included
- Assumptions explicitly documented

---

## References

- MCP SDK: https://github.com/modelcontextprotocol/sdk
- Inspiration: Shape Up (Basecamp), PRD templates
