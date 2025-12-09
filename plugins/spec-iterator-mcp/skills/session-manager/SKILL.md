# Session Manager Skill

Deterministic operations for managing clarification sessions.

## Purpose

Provides reliable, consistent session CRUD operations with no AI interpretation needed.

## Operations

### Create Session

```typescript
function createSession(requirement: string, context?: Context): Session {
  const session: Session = {
    id: generateUUID(),
    requirement,
    context: context || {},
    status: 'in_progress',
    round: 1,
    clarifications: [],
    assumptions: [],
    completeness: {
      overall: 0,
      functional: 0,
      technical: 0,
      ux: 0,
      edgeCases: 0,
      constraints: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveSession(session);
  return session;
}
```

### Load Session

```typescript
function loadSession(sessionId: string): Session | null {
  const path = `outputs/sessions/${sessionId}.json`;
  if (!exists(path)) return null;
  return JSON.parse(readFile(path));
}
```

### Save Session

```typescript
function saveSession(session: Session): void {
  session.updatedAt = new Date().toISOString();
  const path = `outputs/sessions/${session.id}.json`;
  writeFile(path, JSON.stringify(session, null, 2));
}
```

### List Sessions

```typescript
function listSessions(): SessionSummary[] {
  const files = glob('outputs/sessions/*.json');
  return files.map(file => {
    const session = JSON.parse(readFile(file));
    return {
      id: session.id,
      requirement: session.requirement.substring(0, 50) + '...',
      status: session.status,
      completeness: session.completeness.overall,
      updatedAt: session.updatedAt
    };
  });
}
```

### Update Session Status

```typescript
function updateStatus(sessionId: string, status: SessionStatus): void {
  const session = loadSession(sessionId);
  if (!session) throw new Error('Session not found');

  session.status = status;
  saveSession(session);
}
```

### Add Clarification

```typescript
function addClarification(
  sessionId: string,
  questionId: string,
  answer: string
): void {
  const session = loadSession(sessionId);
  if (!session) throw new Error('Session not found');

  const pending = session.pendingQuestions?.find(q => q.id === questionId);
  if (!pending) throw new Error('Question not found');

  session.clarifications.push({
    questionId,
    question: pending.question,
    answer,
    category: pending.category,
    answeredAt: new Date().toISOString()
  });

  session.pendingQuestions = session.pendingQuestions?.filter(
    q => q.id !== questionId
  );

  saveSession(session);
}
```

## Data Types

```typescript
interface Session {
  id: string;
  requirement: string;
  context: Context;
  status: SessionStatus;
  round: number;
  clarifications: Clarification[];
  pendingQuestions?: Question[];
  assumptions: Assumption[];
  completeness: Completeness;
  specPath?: string;
  createdAt: string;
  updatedAt: string;
}

type SessionStatus = 'in_progress' | 'ready_to_generate' | 'complete';

interface Context {
  domain?: string;
  audience?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
}

interface Clarification {
  questionId: string;
  question: string;
  answer: string;
  category: Category;
  answeredAt: string;
}

interface Question {
  id: string;
  question: string;
  category: Category;
  priority: Priority;
  why?: string;
  buildsOn?: string;
}

type Category = 'functional' | 'technical' | 'ux' | 'edge_case' | 'constraint';
type Priority = 'critical' | 'important' | 'nice_to_have';

interface Completeness {
  overall: number;
  functional: number;
  technical: number;
  ux: number;
  edgeCases: number;
  constraints: number;
}

interface Assumption {
  fromQuestion?: string;
  assumption: string;
  reason: string;
}
```

## File Structure

```
outputs/
├── sessions/
│   ├── abc123-def456.json
│   └── xyz789-uvw012.json
└── specs/
    ├── sales-dashboard-spec.md
    └── user-auth-spec.json
```

## Usage in Commands

Commands use this skill for all session persistence:

```markdown
<!-- In start.md -->
1. Use `session-manager` skill to create new session
2. Pass session to requirement-analyzer agent
3. Save returned questions to session
```

```markdown
<!-- In answer.md -->
1. Use `session-manager` skill to load session
2. Use `session-manager` to add clarifications
3. Pass to question-generator agent
4. Save new questions to session
```
