---
description: Scaffold and implement MCP server from spec
---

# Stage 5: BUILD

Scaffold and implement MCP server/Apify Actor from specification.

## Prerequisites

Requires `outputs/spec/{name}-spec.md` from Stage 4.

## Parameters

Parse from user input:
- `--name`: Spec name to build (required if multiple specs exist)
- `--target`: apify | mcp-standalone | npm (default: apify)

## Process

Use the `mcp-builder` agent to:

1. **Load spec** from `outputs/spec/{name}-spec.md`

2. **Scaffold Apify Actor structure:**

   ```
   outputs/build/{name}/
   ├── src/
   │   ├── main.ts          # Entry point
   │   ├── routes.ts        # Request handlers (if applicable)
   │   └── utils/
   │       ├── api.ts       # External API clients
   │       └── helpers.ts   # Utility functions
   ├── .actor/
   │   ├── actor.json       # Actor configuration
   │   └── input_schema.json # Input validation schema
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```

3. **Implement core functionality:**

   a. **Main entry point** with Apify Actor lifecycle
   ```typescript
   import { Actor } from 'apify';

   await Actor.init();
   try {
     const input = await Actor.getInput();
     // Implementation
     await Actor.charge('event-type', { count: n });
   } finally {
     await Actor.exit();
   }
   ```

   b. **PPE charging** for each billable event

   c. **Input schema** with validation

   d. **Error handling** with proper logging

   e. **Progress tracking** for long operations

4. **Generate input_schema.json** from spec requirements

5. **Generate README.md** with usage examples

6. **Save** complete codebase to `outputs/build/{name}/`

## Output Structure

```
outputs/build/{name}/
├── src/
│   ├── main.ts
│   ├── routes.ts
│   └── utils/
├── .actor/
│   ├── actor.json
│   └── input_schema.json
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

## Actor.json Template

```json
{
  "actorSpecification": 1,
  "name": "{name}",
  "title": "{title}",
  "description": "{description}",
  "version": "0.1.0",
  "buildTag": "latest",
  "input": "./input_schema.json",
  "dockerfile": "./Dockerfile",
  "storages": {
    "dataset": {
      "actorSpecification": 1,
      "title": "Output dataset",
      "description": "Results from the actor run"
    }
  }
}
```

## Next Step

Run `/mcp-pipeline:qa` to test the implementation.
