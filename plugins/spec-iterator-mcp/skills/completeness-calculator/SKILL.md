# Completeness Calculator Skill

Deterministic calculation of specification completeness scores.

## Purpose

Provides consistent, reproducible completeness scoring based on answered questions and their categories/priorities.

## Algorithm

### Category Weights

```typescript
const CATEGORY_WEIGHTS = {
  functional: 0.30,   // What the system does
  technical: 0.25,    // How it's built
  ux: 0.20,           // User experience
  edgeCases: 0.15,    // Error handling
  constraints: 0.10   // Business limits
};
```

### Priority Weights

```typescript
const PRIORITY_WEIGHTS = {
  critical: 40,
  important: 35,
  nice_to_have: 25
};
```

### Calculation

```typescript
function calculateCompleteness(
  clarifications: Clarification[],
  pendingQuestions: Question[]
): Completeness {
  const allQuestions = [
    ...clarifications.map(c => ({
      category: c.category,
      priority: getPriority(c.questionId),
      answered: true
    })),
    ...pendingQuestions.map(q => ({
      category: q.category,
      priority: q.priority,
      answered: false
    }))
  ];

  const categoryScores: Record<Category, number> = {
    functional: 0,
    technical: 0,
    ux: 0,
    edgeCases: 0,
    constraints: 0
  };

  // Calculate per-category scores
  for (const category of Object.keys(categoryScores) as Category[]) {
    const categoryQuestions = allQuestions.filter(q => q.category === category);

    if (categoryQuestions.length === 0) {
      // No questions in category = assume partial coverage
      categoryScores[category] = 30;
      continue;
    }

    const maxPoints = categoryQuestions.reduce(
      (sum, q) => sum + PRIORITY_WEIGHTS[q.priority],
      0
    );

    const earnedPoints = categoryQuestions
      .filter(q => q.answered)
      .reduce((sum, q) => sum + PRIORITY_WEIGHTS[q.priority], 0);

    categoryScores[category] = Math.round((earnedPoints / maxPoints) * 100);
  }

  // Calculate weighted overall
  const overall = Math.round(
    categoryScores.functional * CATEGORY_WEIGHTS.functional +
    categoryScores.technical * CATEGORY_WEIGHTS.technical +
    categoryScores.ux * CATEGORY_WEIGHTS.ux +
    categoryScores.edgeCases * CATEGORY_WEIGHTS.edgeCases +
    categoryScores.constraints * CATEGORY_WEIGHTS.constraints
  );

  return {
    overall,
    functional: categoryScores.functional,
    technical: categoryScores.technical,
    ux: categoryScores.ux,
    edgeCases: categoryScores.edgeCases,
    constraints: categoryScores.constraints
  };
}
```

## Thresholds

```typescript
const THRESHOLDS = {
  LOW: 40,           // Below this: significant gaps
  PARTIAL: 60,       // Below this: needs more work
  GOOD: 80,          // At or above: can generate
  EXCELLENT: 90      // High confidence spec
};

function getStatus(overall: number): string {
  if (overall < THRESHOLDS.LOW) return 'low';
  if (overall < THRESHOLDS.PARTIAL) return 'partial';
  if (overall < THRESHOLDS.GOOD) return 'good';
  return 'ready';
}

function canGenerate(completeness: Completeness): boolean {
  return completeness.overall >= THRESHOLDS.GOOD;
}
```

## Visual Representation

```typescript
function renderProgressBar(score: number, width: number = 20): string {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function renderCompleteness(completeness: Completeness): string {
  return `
Completeness:
  Overall:     ${renderProgressBar(completeness.overall)}  ${completeness.overall}%
  Functional:  ${renderProgressBar(completeness.functional)}  ${completeness.functional}%
  Technical:   ${renderProgressBar(completeness.technical)}  ${completeness.technical}%
  UX:          ${renderProgressBar(completeness.ux)}  ${completeness.ux}%
  Edge Cases:  ${renderProgressBar(completeness.edgeCases)}  ${completeness.edgeCases}%
  Constraints: ${renderProgressBar(completeness.constraints)}  ${completeness.constraints}%
  `.trim();
}
```

## Usage

```typescript
// After answering questions
const completeness = calculateCompleteness(
  session.clarifications,
  session.pendingQuestions || []
);

// Update session
session.completeness = completeness;

// Check if ready
if (canGenerate(completeness)) {
  session.status = 'ready_to_generate';
}
```

## Edge Cases

### No Questions Asked Yet
- Return baseline scores (15-20% overall)
- All categories start low

### Category Has No Questions
- Assign default 30% (unknown coverage)
- Note in gap analysis

### All Questions Answered
- Can still be < 100% if no nice-to-have questions
- 100% requires comprehensive question coverage

### Round Limits
- If max rounds reached but < 80%, force ready
- Add warning to spec generation
