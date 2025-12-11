"""Pydantic models for spec-iterator-mcp."""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class QuestionCategory(str, Enum):
    FUNCTIONAL = "functional"
    TECHNICAL = "technical"
    UX = "ux"
    EDGE_CASE = "edge_case"
    CONSTRAINT = "constraint"


class QuestionPriority(str, Enum):
    CRITICAL = "critical"
    IMPORTANT = "important"
    NICE_TO_HAVE = "nice_to_have"


class SessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    READY_TO_GENERATE = "ready_to_generate"
    COMPLETE = "complete"


class Audience(str, Enum):
    TECHNICAL = "technical"
    BUSINESS = "business"
    MIXED = "mixed"


class Complexity(str, Enum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


class FeaturePriority(str, Enum):
    MVP = "mvp"
    V2 = "v2"
    FUTURE = "future"


class Impact(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# Core models
class Clarification(BaseModel):
    id: str
    question: str
    answer: Optional[str] = None
    category: QuestionCategory
    priority: QuestionPriority
    why: Optional[str] = None


class CompletenessScore(BaseModel):
    overall: int = 10
    functional: int = 15
    technical: int = 10
    ux: int = 5
    edge_cases: int = 5
    constraints: int = 10


class SessionContext(BaseModel):
    domain: Optional[str] = None
    audience: Optional[Audience] = None
    complexity: Complexity = Complexity.MODERATE


class Session(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    requirement: str
    context: SessionContext
    clarifications: list[Clarification] = Field(default_factory=list)
    completeness: CompletenessScore = Field(default_factory=CompletenessScore)
    assumptions: list[str] = Field(default_factory=list)
    status: SessionStatus = SessionStatus.IN_PROGRESS
    round_count: int = 0


# LLM response models
class AnalyzedQuestion(BaseModel):
    question: str
    category: QuestionCategory
    priority: QuestionPriority
    why: str


class RequirementAnalysis(BaseModel):
    core_need: str
    entities: list[str]
    implicit_assumptions: list[str]
    questions: list[AnalyzedQuestion]


class GeneratedQuestions(BaseModel):
    questions: list[AnalyzedQuestion]
    observations: list[str] = Field(default_factory=list)


class GapItem(BaseModel):
    category: QuestionCategory
    description: str
    impact: Impact
    recommendation: str


class GapAnalysis(BaseModel):
    gaps: list[GapItem]
    ready_to_generate: bool
    blocking_gaps: list[str]


class ProblemStatement(BaseModel):
    pain: str
    who: str
    current_workarounds: list[str]


class UserFlowStep(BaseModel):
    step: int
    actor: str
    action: str
    outcome: str


class Feature(BaseModel):
    name: str
    description: str
    acceptance_criteria: list[str]
    priority: FeaturePriority


class EdgeCase(BaseModel):
    scenario: str
    handling: str


class GeneratedSpec(BaseModel):
    title: str
    problem_statement: ProblemStatement
    user_flow: list[UserFlowStep]
    features: list[Feature]
    edge_cases: list[EdgeCase]
    assumptions: list[str]
    open_questions: list[str]


# API input models
class AnswerInput(BaseModel):
    question_id: str
    answer: str
