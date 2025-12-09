// In-memory session storage (for Smithery, sessions persist per-connection)

import { Session, CompletenessScore } from './types.js';
import { v4 as uuidv4 } from 'uuid';

const sessions = new Map<string, Session>();

export function createSession(requirement: string, context?: { domain?: string; audience?: 'technical' | 'business' | 'mixed' }): Session {
  const id = uuidv4();
  const now = new Date().toISOString();

  const session: Session = {
    id,
    createdAt: now,
    updatedAt: now,
    requirement,
    context: {
      domain: context?.domain,
      audience: context?.audience,
      complexity: 'moderate'
    },
    clarifications: [],
    completeness: {
      overall: 10,
      functional: 15,
      technical: 10,
      ux: 5,
      edgeCases: 5,
      constraints: 10
    },
    assumptions: [],
    status: 'in_progress',
    roundCount: 0
  };

  sessions.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function updateSession(id: string, updates: Partial<Session>): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;

  const updated = {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  sessions.set(id, updated);
  return updated;
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export function listSessions(): Session[] {
  return Array.from(sessions.values());
}

export function calculateCompleteness(session: Session): CompletenessScore {
  const answered = session.clarifications.filter(c => c.answer !== null);
  const total = session.clarifications.length || 1;

  // Weight by category
  const categoryWeights = {
    functional: 0.30,
    technical: 0.25,
    ux: 0.20,
    edge_case: 0.15,
    constraint: 0.10
  };

  const categoryScores: Record<string, number> = {
    functional: 0,
    technical: 0,
    ux: 0,
    edgeCases: 0,
    constraints: 0
  };

  const categoryCounts: Record<string, { answered: number; total: number }> = {
    functional: { answered: 0, total: 0 },
    technical: { answered: 0, total: 0 },
    ux: { answered: 0, total: 0 },
    edge_case: { answered: 0, total: 0 },
    constraint: { answered: 0, total: 0 }
  };

  for (const c of session.clarifications) {
    categoryCounts[c.category].total++;
    if (c.answer) {
      categoryCounts[c.category].answered++;
    }
  }

  // Calculate per-category scores
  categoryScores.functional = categoryCounts.functional.total > 0
    ? Math.round((categoryCounts.functional.answered / categoryCounts.functional.total) * 100)
    : 15;
  categoryScores.technical = categoryCounts.technical.total > 0
    ? Math.round((categoryCounts.technical.answered / categoryCounts.technical.total) * 100)
    : 10;
  categoryScores.ux = categoryCounts.ux.total > 0
    ? Math.round((categoryCounts.ux.answered / categoryCounts.ux.total) * 100)
    : 5;
  categoryScores.edgeCases = categoryCounts.edge_case.total > 0
    ? Math.round((categoryCounts.edge_case.answered / categoryCounts.edge_case.total) * 100)
    : 5;
  categoryScores.constraints = categoryCounts.constraint.total > 0
    ? Math.round((categoryCounts.constraint.answered / categoryCounts.constraint.total) * 100)
    : 10;

  // Weighted overall
  const overall = Math.round(
    categoryScores.functional * categoryWeights.functional +
    categoryScores.technical * categoryWeights.technical +
    categoryScores.ux * categoryWeights.ux +
    categoryScores.edgeCases * categoryWeights.edge_case +
    categoryScores.constraints * categoryWeights.constraint
  );

  // Boost based on round count (more rounds = more complete)
  const roundBonus = Math.min(session.roundCount * 10, 30);

  return {
    overall: Math.min(overall + roundBonus, 100),
    functional: Math.min(categoryScores.functional + roundBonus, 100),
    technical: Math.min(categoryScores.technical + roundBonus, 100),
    ux: Math.min(categoryScores.ux + roundBonus, 100),
    edgeCases: Math.min(categoryScores.edgeCases + roundBonus, 100),
    constraints: Math.min(categoryScores.constraints + roundBonus, 100)
  };
}
