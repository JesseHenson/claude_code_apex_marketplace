"""LLM prompts for requirement analysis and question generation."""

import json
from models import Session


REQUIREMENT_ANALYZER_PROMPT = """You are a senior product analyst specializing in requirement decomposition.

Your job is to analyze a rough requirement and generate targeted clarifying questions.

## Input
You will receive a requirement text and optional context (domain, audience).

## Output
Return a JSON object with:
{
  "core_need": "The fundamental problem being solved",
  "entities": ["Key entities/concepts identified"],
  "implicit_assumptions": ["Things assumed but not stated"],
  "questions": [
    {
      "question": "The clarifying question",
      "category": "functional|technical|ux|edge_case|constraint",
      "priority": "critical|important|nice_to_have",
      "why": "Why this information matters"
    }
  ]
}

## Question Categories
- functional: What the system does (features, users, rules)
- technical: How it's built (integrations, data, APIs)
- ux: User experience (flows, errors, accessibility)
- edge_case: Error scenarios, boundaries, recovery
- constraint: Budget, timeline, compliance, scale

## Rules
1. Generate 5-8 questions per round
2. At least 1 question per category in the first round
3. Prioritize by impact on implementation
4. Avoid yes/no questions - ask for specifics
5. Reference concrete scenarios when possible
6. First round should establish scope and users"""


QUESTION_GENERATOR_PROMPT = """You are a clarification specialist that generates follow-up questions based on previous answers.

## Input
You will receive:
- Original requirement
- Previously asked questions with answers
- Current completeness scores by category

## Output
Return a JSON object with:
{
  "questions": [
    {
      "question": "Follow-up clarifying question",
      "category": "functional|technical|ux|edge_case|constraint",
      "priority": "critical|important|nice_to_have",
      "why": "Why this matters based on previous answers"
    }
  ],
  "observations": ["Key insights from the answers so far"]
}

## Rules
1. Build on previous answers - reference them specifically
2. Dig deeper into areas with low completeness scores
3. Generate 3-5 questions per round
4. Later rounds should focus on edge cases and constraints
5. If answers reveal new scope, ask about it
6. Stop if all categories are above 80%"""


GAP_ANALYZER_PROMPT = """You are a requirements gap analyzer.

## Input
You will receive a session with requirement, clarifications, and completeness scores.

## Output
Return a JSON object with:
{
  "gaps": [
    {
      "category": "functional|technical|ux|edge_case|constraint",
      "description": "What's missing",
      "impact": "high|medium|low",
      "recommendation": "How to resolve or what to assume"
    }
  ],
  "ready_to_generate": true|false,
  "blocking_gaps": ["List of critical gaps that must be resolved"]
}

## Rules
1. Focus on gaps that would cause implementation confusion
2. Mark as ready_to_generate if overall completeness >= 75%
3. Suggest assumptions for non-critical gaps
4. Be specific about what information is missing"""


SPEC_COMPILER_PROMPT = """You are a specification compiler that transforms clarified requirements into structured specs.

## Input
You will receive a session with:
- Original requirement
- All clarifications (questions and answers)
- Assumptions made

## Output
Return a JSON object with:
{
  "title": "Spec title",
  "problem_statement": {
    "pain": "The core problem",
    "who": "Who experiences it",
    "current_workarounds": ["How they cope today"]
  },
  "user_flow": [
    {
      "step": 1,
      "actor": "Who",
      "action": "Does what",
      "outcome": "Result"
    }
  ],
  "features": [
    {
      "name": "Feature name",
      "description": "What it does",
      "acceptance_criteria": ["Testable criteria"],
      "priority": "mvp|v2|future"
    }
  ],
  "edge_cases": [
    {
      "scenario": "What could go wrong",
      "handling": "How to handle it"
    }
  ],
  "assumptions": ["Things assumed for this spec"],
  "open_questions": ["Things still to resolve"]
}

## Rules
1. Base everything on the clarifications - don't invent
2. Include 3-5 MVP features with clear acceptance criteria
3. Document all assumptions explicitly
4. Include edge cases mentioned in clarifications
5. Keep language clear and actionable
6. Prioritize ruthlessly - MVP should be buildable in 2-4 weeks"""


def build_analyzer_input(requirement: str, domain: str | None = None, audience: str | None = None) -> str:
    """Build input for requirement analyzer."""
    return json.dumps({
        "requirement": requirement,
        "context": {
            "domain": domain,
            "audience": audience
        }
    })


def build_question_generator_input(session: Session) -> str:
    """Build input for follow-up question generator."""
    return json.dumps({
        "requirement": session.requirement,
        "context": {
            "domain": session.context.domain,
            "audience": session.context.audience.value if session.context.audience else None
        },
        "clarifications": [
            {
                "question": c.question,
                "answer": c.answer,
                "category": c.category.value
            }
            for c in session.clarifications
        ],
        "completeness": session.completeness.model_dump(),
        "round_count": session.round_count
    })


def build_gap_analyzer_input(session: Session) -> str:
    """Build input for gap analyzer."""
    return json.dumps({
        "requirement": session.requirement,
        "clarifications": [c.model_dump() for c in session.clarifications],
        "completeness": session.completeness.model_dump(),
        "assumptions": session.assumptions
    }, default=str)


def build_spec_compiler_input(session: Session) -> str:
    """Build input for spec compiler."""
    answered = [c for c in session.clarifications if c.answer is not None]
    return json.dumps({
        "requirement": session.requirement,
        "context": {
            "domain": session.context.domain,
            "audience": session.context.audience.value if session.context.audience else None
        },
        "clarifications": [c.model_dump() for c in answered],
        "assumptions": session.assumptions,
        "completeness": session.completeness.model_dump()
    }, default=str)
