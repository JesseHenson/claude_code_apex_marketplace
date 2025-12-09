import { Session, CompletenessScore } from './types.js';
export declare function createSession(requirement: string, context?: {
    domain?: string;
    audience?: 'technical' | 'business' | 'mixed';
}): Session;
export declare function getSession(id: string): Session | undefined;
export declare function updateSession(id: string, updates: Partial<Session>): Session | undefined;
export declare function deleteSession(id: string): boolean;
export declare function listSessions(): Session[];
export declare function calculateCompleteness(session: Session): CompletenessScore;
