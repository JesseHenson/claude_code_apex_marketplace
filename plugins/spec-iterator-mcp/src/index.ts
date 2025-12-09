import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";

import {
  REQUIREMENT_ANALYZER_PROMPT,
  QUESTION_GENERATOR_PROMPT,
  GAP_ANALYZER_PROMPT,
  SPEC_COMPILER_PROMPT,
  buildAnalyzerInput,
  buildQuestionGeneratorInput,
  buildGapAnalyzerInput,
  buildSpecCompilerInput
} from "./prompts.js";

import { Session, Clarification, GeneratedSpec, GapAnalysis, CompletenessScore } from "./types.js";

// Config schema for Smithery
export const configSchema = z.object({
  ANTHROPIC_API_KEY: z.string().describe("Your Anthropic API key for Claude")
});

// In-memory session storage
const sessions = new Map<string, Session>();

function createSession(requirement: string, context?: { domain?: string; audience?: 'technical' | 'business' | 'mixed' }): Session {
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

function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

function updateSession(id: string, updates: Partial<Session>): Session | undefined {
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

function listSessions(): Session[] {
  return Array.from(sessions.values());
}

function calculateCompleteness(session: Session): CompletenessScore {
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

  const overall = Math.round(
    categoryScores.functional * categoryWeights.functional +
    categoryScores.technical * categoryWeights.technical +
    categoryScores.ux * categoryWeights.ux +
    categoryScores.edgeCases * categoryWeights.edge_case +
    categoryScores.constraints * categoryWeights.constraint
  );

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

// Parse JSON from Claude response
function parseJsonResponse<T>(response: string): T {
  let cleaned = response.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim()) as T;
}

// Format spec as markdown
function formatSpecAsMarkdown(spec: GeneratedSpec, session: Session): string {
  const lines: string[] = [
    `# ${spec.title}`,
    "",
    `**Generated:** ${new Date().toISOString().split("T")[0]}`,
    `**Session:** ${session.id}`,
    `**Completeness:** ${session.completeness.overall}%`,
    "",
    "---",
    "",
    "## Problem Statement",
    "",
    `**Pain:** ${spec.problemStatement.pain}`,
    "",
    `**Who:** ${spec.problemStatement.who}`,
    "",
    "**Current Workarounds:**",
    ...spec.problemStatement.currentWorkarounds.map(w => `- ${w}`),
    "",
    "---",
    "",
    "## User Flow",
    "",
    ...spec.userFlow.map(step =>
      `${step.step}. **${step.actor}** → ${step.action} → *${step.outcome}*`
    ),
    "",
    "---",
    "",
    "## Features",
    ""
  ];

  for (const feature of spec.features) {
    lines.push(`### ${feature.name} (${feature.priority.toUpperCase()})`);
    lines.push("");
    lines.push(feature.description);
    lines.push("");
    lines.push("**Acceptance Criteria:**");
    for (const criteria of feature.acceptanceCriteria) {
      lines.push(`- [ ] ${criteria}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Edge Cases");
  lines.push("");

  for (const edge of spec.edgeCases) {
    lines.push(`| ${edge.scenario} | ${edge.handling} |`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Assumptions");
  lines.push("");
  for (const assumption of spec.assumptions) {
    lines.push(`- ${assumption}`);
  }

  if (spec.openQuestions.length > 0) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Open Questions");
    lines.push("");
    for (const question of spec.openQuestions) {
      lines.push(`- [ ] ${question}`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*Generated by Spec Iterator MCP*");

  return lines.join("\n");
}

// Default export for Smithery
export default function createServer({ config }: { config: z.infer<typeof configSchema> }) {
  // Initialize Anthropic client with user's API key
  const anthropic = new Anthropic({
    apiKey: config.ANTHROPIC_API_KEY
  });

  // Helper to call Claude
  async function callClaude(systemPrompt: string, userInput: string): Promise<string> {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userInput }]
    });

    const textBlock = response.content.find(block => block.type === "text");
    return textBlock ? textBlock.text : "";
  }

  // Create MCP server
  const server = new McpServer({
    name: "spec-iterator",
    version: "0.1.0"
  });

  // Tool: Start a new clarification session
  server.tool(
    "spec_start_session",
    "Start a new spec clarification session from a rough requirement. Returns session ID and initial clarifying questions.",
    {
      requirement: z.string().describe("The initial requirement or idea to clarify"),
      domain: z.string().optional().describe("Domain context (e.g., 'e-commerce', 'healthcare', 'SaaS')"),
      audience: z.enum(["technical", "business", "mixed"]).optional().describe("Target audience for the spec")
    },
    async ({ requirement, domain, audience }) => {
      const session = createSession(requirement, { domain, audience });
      const input = buildAnalyzerInput(requirement, { domain, audience });
      const response = await callClaude(REQUIREMENT_ANALYZER_PROMPT, input);

      try {
        const analysis = parseJsonResponse<{
          core_need: string;
          entities: string[];
          implicit_assumptions: string[];
          questions: Array<{
            question: string;
            category: string;
            priority: string;
            why: string;
          }>;
        }>(response);

        const clarifications: Clarification[] = analysis.questions.map((q, i) => ({
          id: `q${session.roundCount + 1}_${i + 1}`,
          question: q.question,
          answer: null,
          category: q.category as Clarification["category"],
          priority: q.priority as Clarification["priority"],
          why: q.why
        }));

        updateSession(session.id, {
          clarifications,
          context: {
            ...session.context,
            domain: domain || session.context.domain,
            audience: audience || session.context.audience
          },
          roundCount: 1
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              session_id: session.id,
              status: "in_progress",
              analysis: {
                core_need: analysis.core_need,
                entities: analysis.entities,
                implicit_assumptions: analysis.implicit_assumptions
              },
              questions: clarifications.map(c => ({
                id: c.id,
                question: c.question,
                category: c.category,
                priority: c.priority
              })),
              completeness: session.completeness,
              instructions: "Use spec_answer_questions to provide answers to these questions."
            }, null, 2)
          }]
        };
      } catch (e) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to analyze requirement",
              details: e instanceof Error ? e.message : String(e)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // Tool: Answer clarifying questions
  server.tool(
    "spec_answer_questions",
    "Provide answers to clarifying questions. Returns updated completeness and any follow-up questions.",
    {
      session_id: z.string().describe("The session ID from spec_start_session"),
      answers: z.array(z.object({
        question_id: z.string().describe("The question ID to answer"),
        answer: z.string().describe("Your answer to the question")
      })).describe("Array of answers to questions")
    },
    async ({ session_id, answers }) => {
      const session = getSession(session_id);
      if (!session) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ error: "Session not found", session_id })
          }],
          isError: true
        };
      }

      const updatedClarifications = session.clarifications.map(c => {
        const answer = answers.find(a => a.question_id === c.id);
        if (answer) {
          return { ...c, answer: answer.answer };
        }
        return c;
      });

      const tempSession = { ...session, clarifications: updatedClarifications };
      const newCompleteness = calculateCompleteness(tempSession);
      const needsMoreQuestions = newCompleteness.overall < 80 && session.roundCount < 5;

      let newQuestions: Clarification[] = [];

      if (needsMoreQuestions) {
        const input = buildQuestionGeneratorInput({
          ...session,
          clarifications: updatedClarifications,
          completeness: newCompleteness
        });

        const response = await callClaude(QUESTION_GENERATOR_PROMPT, input);

        try {
          const generated = parseJsonResponse<{
            questions: Array<{
              question: string;
              category: string;
              priority: string;
              why: string;
            }>;
          }>(response);

          newQuestions = generated.questions.map((q, i) => ({
            id: `q${session.roundCount + 2}_${i + 1}`,
            question: q.question,
            answer: null,
            category: q.category as Clarification["category"],
            priority: q.priority as Clarification["priority"],
            why: q.why
          }));
        } catch (e) {
          // Continue without new questions
        }
      }

      const allClarifications = [...updatedClarifications, ...newQuestions];
      const finalCompleteness = calculateCompleteness({ ...session, clarifications: allClarifications, roundCount: session.roundCount + 1 });
      const status = finalCompleteness.overall >= 80 ? "ready_to_generate" : "in_progress";

      updateSession(session_id, {
        clarifications: allClarifications,
        completeness: finalCompleteness,
        status,
        roundCount: session.roundCount + 1
      });

      const pendingQuestions = allClarifications.filter(c => c.answer === null);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            session_id,
            status,
            completeness: finalCompleteness,
            round: session.roundCount + 1,
            answers_recorded: answers.length,
            pending_questions: pendingQuestions.map(c => ({
              id: c.id,
              question: c.question,
              category: c.category,
              priority: c.priority
            })),
            next_step: status === "ready_to_generate"
              ? "Completeness threshold reached. Use spec_generate to create the specification."
              : `Answer the ${pendingQuestions.length} pending questions to continue.`
          }, null, 2)
        }]
      };
    }
  );

  // Tool: Get gap analysis
  server.tool(
    "spec_get_gaps",
    "Analyze gaps in the current session and get recommendations for improving completeness.",
    {
      session_id: z.string().describe("The session ID to analyze")
    },
    async ({ session_id }) => {
      const session = getSession(session_id);
      if (!session) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ error: "Session not found", session_id })
          }],
          isError: true
        };
      }

      const input = buildGapAnalyzerInput(session);
      const response = await callClaude(GAP_ANALYZER_PROMPT, input);

      try {
        const analysis = parseJsonResponse<{
          gaps: GapAnalysis[];
          ready_to_generate: boolean;
          blocking_gaps: string[];
        }>(response);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              session_id,
              completeness: session.completeness,
              gap_analysis: analysis,
              recommendation: analysis.ready_to_generate
                ? "Ready to generate specification. Use spec_generate."
                : `Resolve blocking gaps first: ${analysis.blocking_gaps.join(", ")}`
            }, null, 2)
          }]
        };
      } catch (e) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to analyze gaps",
              details: e instanceof Error ? e.message : String(e),
              completeness: session.completeness
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // Tool: Generate specification
  server.tool(
    "spec_generate",
    "Generate the final structured specification from a clarification session.",
    {
      session_id: z.string().describe("The session ID to generate spec from"),
      format: z.enum(["json", "markdown"]).optional().default("markdown").describe("Output format")
    },
    async ({ session_id, format }) => {
      const session = getSession(session_id);
      if (!session) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ error: "Session not found", session_id })
          }],
          isError: true
        };
      }

      if (session.completeness.overall < 60) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              warning: "Completeness is below 60%. Spec may have significant gaps.",
              completeness: session.completeness,
              suggestion: "Continue answering questions or use spec_get_gaps to see what's missing."
            }, null, 2)
          }]
        };
      }

      const input = buildSpecCompilerInput(session);
      const response = await callClaude(SPEC_COMPILER_PROMPT, input);

      try {
        const spec = parseJsonResponse<GeneratedSpec>(response);
        updateSession(session_id, { status: "complete" });

        if (format === "markdown") {
          const markdown = formatSpecAsMarkdown(spec, session);
          return {
            content: [{
              type: "text" as const,
              text: markdown
            }]
          };
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              session_id,
              status: "complete",
              completeness: session.completeness,
              specification: spec
            }, null, 2)
          }]
        };
      } catch (e) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to generate specification",
              details: e instanceof Error ? e.message : String(e)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // Tool: Get session status
  server.tool(
    "spec_get_status",
    "Get the current status of a clarification session.",
    {
      session_id: z.string().describe("The session ID to check")
    },
    async ({ session_id }) => {
      const session = getSession(session_id);
      if (!session) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ error: "Session not found", session_id })
          }],
          isError: true
        };
      }

      const pendingQuestions = session.clarifications.filter(c => c.answer === null);
      const answeredQuestions = session.clarifications.filter(c => c.answer !== null);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            session_id,
            status: session.status,
            created_at: session.createdAt,
            updated_at: session.updatedAt,
            requirement: session.requirement,
            context: session.context,
            completeness: session.completeness,
            round_count: session.roundCount,
            questions: {
              total: session.clarifications.length,
              answered: answeredQuestions.length,
              pending: pendingQuestions.length
            },
            pending_questions: pendingQuestions.map(c => ({
              id: c.id,
              question: c.question,
              category: c.category
            })),
            assumptions: session.assumptions
          }, null, 2)
        }]
      };
    }
  );

  // Tool: List all sessions
  server.tool(
    "spec_list_sessions",
    "List all active clarification sessions.",
    {},
    async () => {
      const allSessions = listSessions();

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            sessions: allSessions.map(s => ({
              id: s.id,
              requirement: s.requirement.substring(0, 100) + (s.requirement.length > 100 ? "..." : ""),
              status: s.status,
              completeness: s.completeness.overall,
              created_at: s.createdAt
            }))
          }, null, 2)
        }]
      };
    }
  );

  // Return the server for Smithery
  return server.server;
}
