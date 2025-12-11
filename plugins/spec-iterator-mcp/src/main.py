"""Spec Iterator MCP Server - Transform rough requirements into complete specifications."""

import json
import os
import uuid
from datetime import datetime
from typing import Any

import anthropic
import uvicorn
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from starlette.middleware.cors import CORSMiddleware

from middleware import SmitheryConfigMiddleware
from models import (
    Audience,
    Clarification,
    CompletenessScore,
    GapAnalysis,
    GeneratedSpec,
    QuestionCategory,
    QuestionPriority,
    RequirementAnalysis,
    GeneratedQuestions,
    Session,
    SessionContext,
    SessionStatus,
)
from prompts import (
    REQUIREMENT_ANALYZER_PROMPT,
    QUESTION_GENERATOR_PROMPT,
    GAP_ANALYZER_PROMPT,
    SPEC_COMPILER_PROMPT,
    build_analyzer_input,
    build_question_generator_input,
    build_gap_analyzer_input,
    build_spec_compiler_input,
)

# Load environment variables
load_dotenv()

# Initialize FastMCP server
mcp = FastMCP(
    name="spec-iterator",
    instructions="Transform rough requirements into complete technical specifications through AI-powered clarification dialogues."
)

# In-memory session storage
sessions: dict[str, Session] = {}

# Anthropic client (initialized lazily)
_client: anthropic.Anthropic | None = None
_current_api_key: str | None = None


def set_api_key(api_key: str) -> None:
    """Set the API key from Smithery config middleware."""
    global _current_api_key, _client
    if api_key and api_key != _current_api_key:
        _current_api_key = api_key
        _client = None  # Reset client to use new key


def get_client() -> anthropic.Anthropic:
    """Get or create Anthropic client."""
    global _client
    if _client is None:
        # Try Smithery config first, then env var
        api_key = _current_api_key or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY is required. "
                "Configure it in Smithery or set as environment variable."
            )
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


async def call_claude(system_prompt: str, user_input: str) -> str:
    """Call Claude API with error handling."""
    try:
        client = get_client()
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_input}]
        )

        for block in response.content:
            if block.type == "text":
                return block.text
        return ""

    except anthropic.AuthenticationError:
        raise ValueError(
            "API authentication failed. The ANTHROPIC_API_KEY may be invalid or expired. "
            "Please check your API key at console.anthropic.com."
        )
    except anthropic.RateLimitError:
        raise ValueError(
            "API rate limit exceeded. Wait a few moments and try again, "
            "or check your usage at console.anthropic.com."
        )
    except anthropic.APIStatusError as e:
        if e.status_code >= 500:
            raise ValueError(
                "Anthropic API is temporarily unavailable. "
                "Wait a few moments and retry the operation."
            )
        raise ValueError(f"API call failed: {e.message}")
    except Exception as e:
        raise ValueError(f"API call failed: {str(e)}")


def parse_json_response(response: str) -> dict[str, Any]:
    """Parse JSON from Claude response, handling markdown code blocks."""
    cleaned = response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


def calculate_completeness(session: Session) -> CompletenessScore:
    """Calculate completeness scores based on answered questions."""
    category_weights = {
        QuestionCategory.FUNCTIONAL: 0.30,
        QuestionCategory.TECHNICAL: 0.25,
        QuestionCategory.UX: 0.20,
        QuestionCategory.EDGE_CASE: 0.15,
        QuestionCategory.CONSTRAINT: 0.10,
    }

    category_counts: dict[QuestionCategory, dict[str, int]] = {
        cat: {"answered": 0, "total": 0} for cat in QuestionCategory
    }

    for c in session.clarifications:
        category_counts[c.category]["total"] += 1
        if c.answer:
            category_counts[c.category]["answered"] += 1

    def calc_score(cat: QuestionCategory, default: int) -> int:
        counts = category_counts[cat]
        if counts["total"] > 0:
            return round((counts["answered"] / counts["total"]) * 100)
        return default

    functional = calc_score(QuestionCategory.FUNCTIONAL, 15)
    technical = calc_score(QuestionCategory.TECHNICAL, 10)
    ux = calc_score(QuestionCategory.UX, 5)
    edge_cases = calc_score(QuestionCategory.EDGE_CASE, 5)
    constraints = calc_score(QuestionCategory.CONSTRAINT, 10)

    overall = round(
        functional * category_weights[QuestionCategory.FUNCTIONAL] +
        technical * category_weights[QuestionCategory.TECHNICAL] +
        ux * category_weights[QuestionCategory.UX] +
        edge_cases * category_weights[QuestionCategory.EDGE_CASE] +
        constraints * category_weights[QuestionCategory.CONSTRAINT]
    )

    # Round bonus
    round_bonus = min(session.round_count * 10, 30)

    return CompletenessScore(
        overall=min(overall + round_bonus, 100),
        functional=min(functional + round_bonus, 100),
        technical=min(technical + round_bonus, 100),
        ux=min(ux + round_bonus, 100),
        edge_cases=min(edge_cases + round_bonus, 100),
        constraints=min(constraints + round_bonus, 100),
    )


def format_spec_as_markdown(spec: GeneratedSpec, session: Session) -> str:
    """Format specification as markdown document."""
    lines = [
        f"# {spec.title}",
        "",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d')}",
        f"**Session:** {session.id}",
        f"**Completeness:** {session.completeness.overall}%",
        "",
        "---",
        "",
        "## Problem Statement",
        "",
        f"**Pain:** {spec.problem_statement.pain}",
        "",
        f"**Who:** {spec.problem_statement.who}",
        "",
        "**Current Workarounds:**",
    ]

    for w in spec.problem_statement.current_workarounds:
        lines.append(f"- {w}")

    lines.extend([
        "",
        "---",
        "",
        "## User Flow",
        "",
    ])

    for step in spec.user_flow:
        lines.append(f"{step.step}. **{step.actor}** -> {step.action} -> *{step.outcome}*")

    lines.extend([
        "",
        "---",
        "",
        "## Features",
        "",
    ])

    for feature in spec.features:
        lines.append(f"### {feature.name} ({feature.priority.value.upper()})")
        lines.append("")
        lines.append(feature.description)
        lines.append("")
        lines.append("**Acceptance Criteria:**")
        for criteria in feature.acceptance_criteria:
            lines.append(f"- [ ] {criteria}")
        lines.append("")

    lines.extend([
        "---",
        "",
        "## Edge Cases",
        "",
    ])

    for edge in spec.edge_cases:
        lines.append(f"| {edge.scenario} | {edge.handling} |")

    lines.extend([
        "",
        "---",
        "",
        "## Assumptions",
        "",
    ])

    for assumption in spec.assumptions:
        lines.append(f"- {assumption}")

    if spec.open_questions:
        lines.extend([
            "",
            "---",
            "",
            "## Open Questions",
            "",
        ])
        for question in spec.open_questions:
            lines.append(f"- [ ] {question}")

    lines.extend([
        "",
        "---",
        "",
        "*Generated by Spec Iterator MCP*",
    ])

    return "\n".join(lines)


# MCP Tools

@mcp.tool()
async def spec_start_session(
    requirement: str,
    domain: str | None = None,
    audience: str | None = None
) -> str:
    """Start a new specification clarification session from a rough or incomplete requirement.

    USE THIS TOOL WHEN: You have a vague requirement like "build a dashboard" or "we need order tracking"
    and need to systematically uncover missing details before implementation.

    RETURNS: A session_id (save this!) and initial clarifying questions organized by category.

    TYPICAL WORKFLOW: spec_start_session -> spec_answer_questions (repeat until 80%+) -> spec_generate

    Args:
        requirement: The initial requirement, idea, or feature request to clarify.
        domain: Optional domain context (e.g., 'e-commerce', 'healthcare', 'fintech').
        audience: Optional target audience ('technical', 'business', or 'mixed').
    """
    # Create session
    session_id = str(uuid.uuid4())
    now = datetime.now()

    audience_enum = None
    if audience:
        try:
            audience_enum = Audience(audience)
        except ValueError:
            pass

    session = Session(
        id=session_id,
        created_at=now,
        updated_at=now,
        requirement=requirement,
        context=SessionContext(domain=domain, audience=audience_enum),
        round_count=1,
    )

    # Analyze requirement
    input_text = build_analyzer_input(requirement, domain, audience)
    response = await call_claude(REQUIREMENT_ANALYZER_PROMPT, input_text)

    try:
        data = parse_json_response(response)
        analysis = RequirementAnalysis(**data)

        # Convert to clarifications
        clarifications = [
            Clarification(
                id=f"q1_{i+1}",
                question=q.question,
                category=q.category,
                priority=q.priority,
                why=q.why,
            )
            for i, q in enumerate(analysis.questions)
        ]

        session.clarifications = clarifications
        sessions[session_id] = session

        return json.dumps({
            "session_id": session_id,
            "status": "in_progress",
            "analysis": {
                "core_need": analysis.core_need,
                "entities": analysis.entities,
                "implicit_assumptions": analysis.implicit_assumptions,
            },
            "questions": [
                {
                    "id": c.id,
                    "question": c.question,
                    "category": c.category.value,
                    "priority": c.priority.value,
                }
                for c in clarifications
            ],
            "completeness": session.completeness.model_dump(),
            "instructions": "Use spec_answer_questions to provide answers to these questions.",
        }, indent=2)

    except Exception as e:
        return json.dumps({
            "error": "Failed to analyze requirement",
            "details": str(e),
            "recovery": "Try rephrasing your requirement or try again.",
        }, indent=2)


@mcp.tool()
async def spec_answer_questions(
    session_id: str,
    answers: list[dict[str, str]]
) -> str:
    """Provide answers to clarifying questions in an active session.

    USE THIS TOOL WHEN: You have a session_id from spec_start_session and want to answer pending questions.

    RETURNS: Updated completeness scores and any new follow-up questions.

    Args:
        session_id: The session_id returned from spec_start_session.
        answers: List of {"question_id": "q1_1", "answer": "your answer"} objects.
    """
    session = sessions.get(session_id)
    if not session:
        return json.dumps({
            "error": "Session not found",
            "session_id": session_id,
            "recovery": "Use spec_list_sessions to see available sessions, or spec_start_session to create a new one.",
        })

    # Apply answers
    for ans in answers:
        for c in session.clarifications:
            if c.id == ans["question_id"]:
                c.answer = ans["answer"]
                break

    session.updated_at = datetime.now()
    session.completeness = calculate_completeness(session)

    # Check if we need more questions
    needs_more = session.completeness.overall < 80 and session.round_count < 5
    new_questions: list[Clarification] = []

    if needs_more:
        input_text = build_question_generator_input(session)
        response = await call_claude(QUESTION_GENERATOR_PROMPT, input_text)

        try:
            data = parse_json_response(response)
            generated = GeneratedQuestions(**data)

            new_questions = [
                Clarification(
                    id=f"q{session.round_count + 1}_{i+1}",
                    question=q.question,
                    category=q.category,
                    priority=q.priority,
                    why=q.why,
                )
                for i, q in enumerate(generated.questions)
            ]

            session.clarifications.extend(new_questions)
        except Exception:
            pass  # Continue without new questions

    session.round_count += 1
    session.completeness = calculate_completeness(session)

    if session.completeness.overall >= 80:
        session.status = SessionStatus.READY_TO_GENERATE

    pending = [c for c in session.clarifications if c.answer is None]

    return json.dumps({
        "session_id": session_id,
        "status": session.status.value,
        "completeness": session.completeness.model_dump(),
        "round": session.round_count,
        "answers_recorded": len(answers),
        "pending_questions": [
            {
                "id": c.id,
                "question": c.question,
                "category": c.category.value,
                "priority": c.priority.value,
            }
            for c in pending
        ],
        "next_step": (
            "Completeness threshold reached. Use spec_generate to create the specification."
            if session.status == SessionStatus.READY_TO_GENERATE
            else f"Answer the {len(pending)} pending questions to continue."
        ),
    }, indent=2)


@mcp.tool()
async def spec_get_gaps(session_id: str) -> str:
    """Analyze what's missing in a specification session and get recommendations.

    USE THIS TOOL WHEN: You want to understand why completeness is low or identify blocking gaps.

    Args:
        session_id: The session_id to analyze.
    """
    session = sessions.get(session_id)
    if not session:
        return json.dumps({
            "error": "Session not found",
            "session_id": session_id,
            "recovery": "Use spec_list_sessions to see available sessions.",
        })

    input_text = build_gap_analyzer_input(session)
    response = await call_claude(GAP_ANALYZER_PROMPT, input_text)

    try:
        data = parse_json_response(response)
        analysis = GapAnalysis(**data)

        return json.dumps({
            "session_id": session_id,
            "completeness": session.completeness.model_dump(),
            "gap_analysis": {
                "gaps": [g.model_dump() for g in analysis.gaps],
                "ready_to_generate": analysis.ready_to_generate,
                "blocking_gaps": analysis.blocking_gaps,
            },
            "recommendation": (
                "Ready to generate specification. Use spec_generate."
                if analysis.ready_to_generate
                else f"Resolve blocking gaps first: {', '.join(analysis.blocking_gaps)}"
            ),
        }, indent=2)

    except Exception as e:
        return json.dumps({
            "error": "Failed to analyze gaps",
            "details": str(e),
            "completeness": session.completeness.model_dump(),
            "recovery": "Try again or use spec_get_status for a simpler progress check.",
        }, indent=2)


@mcp.tool()
async def spec_generate(
    session_id: str,
    format: str = "markdown"
) -> str:
    """Generate the final structured specification from a completed session.

    USE THIS TOOL WHEN: Completeness is 80%+ and you're ready to generate the spec.

    Args:
        session_id: The session_id to compile into a specification.
        format: Output format - 'markdown' (default) or 'json'.
    """
    session = sessions.get(session_id)
    if not session:
        return json.dumps({
            "error": "Session not found",
            "session_id": session_id,
            "recovery": "Use spec_list_sessions to see available sessions.",
        })

    if session.completeness.overall < 60:
        return json.dumps({
            "warning": "Completeness is below 60%. Spec may have significant gaps.",
            "completeness": session.completeness.model_dump(),
            "suggestion": "Continue answering questions or use spec_get_gaps to see what's missing.",
        }, indent=2)

    input_text = build_spec_compiler_input(session)
    response = await call_claude(SPEC_COMPILER_PROMPT, input_text)

    try:
        data = parse_json_response(response)
        spec = GeneratedSpec(**data)

        session.status = SessionStatus.COMPLETE
        session.updated_at = datetime.now()

        if format == "markdown":
            return format_spec_as_markdown(spec, session)

        return json.dumps({
            "session_id": session_id,
            "status": "complete",
            "completeness": session.completeness.model_dump(),
            "specification": spec.model_dump(),
        }, indent=2)

    except Exception as e:
        return json.dumps({
            "error": "Failed to generate specification",
            "details": str(e),
            "session_id": session_id,
            "completeness": session.completeness.model_dump(),
            "recovery": "Try again - your session progress is saved.",
        }, indent=2)


@mcp.tool()
async def spec_get_status(session_id: str) -> str:
    """Get a quick status overview of a clarification session.

    USE THIS TOOL WHEN: You need to check progress or resume work on a session.

    Args:
        session_id: The session_id to check.
    """
    session = sessions.get(session_id)
    if not session:
        return json.dumps({
            "error": "Session not found",
            "session_id": session_id,
            "recovery": "Use spec_list_sessions to see available sessions.",
        })

    pending = [c for c in session.clarifications if c.answer is None]
    answered = [c for c in session.clarifications if c.answer is not None]

    return json.dumps({
        "session_id": session_id,
        "status": session.status.value,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
        "requirement": session.requirement,
        "context": {
            "domain": session.context.domain,
            "audience": session.context.audience.value if session.context.audience else None,
        },
        "completeness": session.completeness.model_dump(),
        "round_count": session.round_count,
        "questions": {
            "total": len(session.clarifications),
            "answered": len(answered),
            "pending": len(pending),
        },
        "pending_questions": [
            {"id": c.id, "question": c.question, "category": c.category.value}
            for c in pending
        ],
        "assumptions": session.assumptions,
    }, indent=2)


@mcp.tool()
async def spec_list_sessions() -> str:
    """List all clarification sessions stored on this server.

    USE THIS TOOL WHEN: You need to find a previous session or see all work in progress.
    """
    return json.dumps({
        "sessions": [
            {
                "id": s.id,
                "requirement": s.requirement[:100] + ("..." if len(s.requirement) > 100 else ""),
                "status": s.status.value,
                "completeness": s.completeness.overall,
                "created_at": s.created_at.isoformat(),
            }
            for s in sessions.values()
        ]
    }, indent=2)


@mcp.tool()
async def spec_info() -> str:
    """Get server information and health status.

    USE THIS TOOL WHEN: You want to verify the server is working correctly.
    """
    active = [s for s in sessions.values() if s.status == SessionStatus.IN_PROGRESS]
    complete = [s for s in sessions.values() if s.status == SessionStatus.COMPLETE]

    api_status = "configured" if os.getenv("ANTHROPIC_API_KEY") else "missing"

    return json.dumps({
        "server": {
            "name": "spec-iterator",
            "version": "0.1.0",
            "description": "Transform rough requirements into complete technical specifications through AI-powered clarification dialogues",
        },
        "health": {
            "status": "healthy" if api_status == "configured" else "degraded",
            "api": api_status,
            "api_message": (
                "Anthropic API key is configured"
                if api_status == "configured"
                else "ANTHROPIC_API_KEY environment variable is missing"
            ),
        },
        "statistics": {
            "total_sessions": len(sessions),
            "active_sessions": len(active),
            "completed_sessions": len(complete),
        },
        "capabilities": {
            "tools": [
                "spec_start_session",
                "spec_answer_questions",
                "spec_get_gaps",
                "spec_generate",
                "spec_get_status",
                "spec_list_sessions",
                "spec_info",
            ],
            "completeness_categories": [
                "functional (30%)",
                "technical (25%)",
                "UX (20%)",
                "edge_cases (15%)",
                "constraints (10%)",
            ],
            "output_formats": ["markdown", "json"],
        },
        "usage": {
            "typical_workflow": "spec_start_session -> spec_answer_questions (repeat) -> spec_generate",
            "estimated_cost": "$0.05-0.15 per spec (3-5 clarification rounds)",
        },
    }, indent=2)


def main():
    """Run the MCP server."""
    # Get port from environment (Smithery sets PORT=8081)
    port = int(os.getenv("PORT", "8080"))

    # Get the ASGI app and add middleware
    app = mcp.streamable_http_app()

    # Add Smithery config middleware to extract API key from query params
    app.add_middleware(SmitheryConfigMiddleware, set_api_key=set_api_key)

    # Add CORS middleware (Smithery requirements)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["mcp-session-id", "mcp-protocol-version"],
        max_age=86400,
    )

    print(f"> Server starting on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="debug")


if __name__ == "__main__":
    main()
