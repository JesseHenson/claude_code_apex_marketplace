---
description: Generate the final structured specification from a session
---

# GENERATE - Produce Final Specification

Compile all clarifications into a complete, structured specification document.

## Parameters

- `--session`: Session ID (required)
- `--format`: Output format ("markdown", "json", "yaml") - default: markdown
- `--include-assumptions`: Include assumptions section (default: true)
- `--name`: Spec file name (auto-generated from requirement if not provided)

## Process

Use the `spec-compiler` agent to:

1. **Load Session**
   - Retrieve complete session state
   - Verify minimum completeness (warn if <60%)
   - Gather all clarifications and assumptions

2. **Compile Problem Statement**
   - Extract pain point from clarifications
   - Identify target user
   - List current workarounds

3. **Generate User Flow**
   - Create step-by-step flow from answers
   - Identify actors at each step
   - Define expected outcomes

4. **Define Features**
   - Extract features from clarifications
   - Generate acceptance criteria
   - Prioritize as MVP/v2/future

5. **Document Contracts**
   - Define input schema
   - Define output schema
   - Note API contracts if applicable

6. **Catalog Edge Cases**
   - Extract from edge_case clarifications
   - Define handling for each
   - Note any deferred to v2

7. **Compile Final Document**
   - Assemble all sections
   - Include assumptions
   - Add open questions
   - Save to `outputs/specs/{name}-spec.md`

8. **Update Session**
   - Mark session as complete
   - Record spec file path

## Output Formats

### Markdown (default)
Full document with sections, tables, and checklists.
Saved to: `outputs/specs/{name}-spec.md`

### JSON
Structured JSON matching GeneratedSpec interface.
Saved to: `outputs/specs/{name}-spec.json`

### YAML
YAML format for tooling integration.
Saved to: `outputs/specs/{name}-spec.yaml`

## Spec Structure

```markdown
# {Title}

## Problem Statement
**Pain:** {problem}
**Who:** {target user}
**Current Workarounds:** {list}

## User Flow
1. **{Actor}**: {Action} ’ {Outcome}
2. ...

## Features

### MVP
#### {Feature Name}
{Description}
**Acceptance Criteria:**
- [ ] {Criterion 1}
- [ ] {Criterion 2}

### V2
...

## Input/Output Contracts

### Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|

### Outputs
| Field | Type | Description |
|-------|------|-------------|

## Edge Cases
| Scenario | Handling |
|----------|----------|

## Assumptions
- {Assumption 1}
- {Assumption 2}

## Open Questions
- [ ] {Question 1}
- [ ] {Question 2}
```

## Usage

### Basic generation
```
/spec-iterator:generate --session abc123-def456
```

### JSON format
```
/spec-iterator:generate --session abc123-def456 --format json
```

### Without assumptions
```
/spec-iterator:generate --session abc123-def456 --include-assumptions false
```

### Custom name
```
/spec-iterator:generate --session abc123-def456 --name sales-dashboard
```

## Quality Warnings

Generation will warn if:
- Completeness < 60%: "Low completeness - spec may have significant gaps"
- Critical questions unanswered: "Critical information missing"
- No edge cases defined: "No edge cases documented"

## Post-Generation

After generation:
- Review spec for accuracy
- Validate assumptions with stakeholders
- Address open questions
- Share with development team
