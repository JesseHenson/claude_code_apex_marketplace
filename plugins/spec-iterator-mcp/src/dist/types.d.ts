export type QuestionCategory = 'functional' | 'technical' | 'ux' | 'edge_case' | 'constraint';
export type QuestionPriority = 'critical' | 'important' | 'nice_to_have';
export type SessionStatus = 'in_progress' | 'ready_to_generate' | 'complete';
export interface Clarification {
    id: string;
    question: string;
    answer: string | null;
    category: QuestionCategory;
    priority: QuestionPriority;
    why?: string;
}
export interface CompletenessScore {
    overall: number;
    functional: number;
    technical: number;
    ux: number;
    edgeCases: number;
    constraints: number;
}
export interface SessionContext {
    domain?: string;
    audience?: 'technical' | 'business' | 'mixed';
    complexity?: 'simple' | 'moderate' | 'complex';
}
export interface Session {
    id: string;
    createdAt: string;
    updatedAt: string;
    requirement: string;
    context: SessionContext;
    clarifications: Clarification[];
    completeness: CompletenessScore;
    assumptions: string[];
    status: SessionStatus;
    roundCount: number;
}
export interface GapAnalysis {
    category: QuestionCategory;
    gaps: string[];
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
}
export interface GeneratedSpec {
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
        priority: 'mvp' | 'v2' | 'future';
    }>;
    edgeCases: Array<{
        scenario: string;
        handling: string;
    }>;
    assumptions: string[];
    openQuestions: string[];
}
