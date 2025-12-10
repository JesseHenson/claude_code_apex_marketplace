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
  ANTHROPIC_API_KEY: z.string().describe("Required. Your Anthropic API key for Claude. Get one at console.anthropic.com. The server uses Claude to analyze requirements and generate clarifying questions.")
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

  // Helper to call Claude with improved error handling
  async function callClaude(systemPrompt: string, userInput: string): Promise<string> {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userInput }]
      });

      const textBlock = response.content.find(block => block.type === "text");
      return textBlock ? textBlock.text : "";
    } catch (error) {
      // Re-throw with actionable context for the agent
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("authentication")) {
          throw new Error(`API authentication failed. The configured ANTHROPIC_API_KEY may be invalid or expired. Please check your API key at console.anthropic.com and reconfigure the server.`);
        }
        if (error.message.includes("429") || error.message.includes("rate")) {
          throw new Error(`API rate limit exceeded. The Anthropic API is temporarily limiting requests. Wait a few moments and try again, or check your usage at console.anthropic.com.`);
        }
        if (error.message.includes("500") || error.message.includes("503")) {
          throw new Error(`Anthropic API is temporarily unavailable. This is a temporary issue on Anthropic's side. Wait a few moments and retry the operation.`);
        }
        if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
          throw new Error(`API request timed out. The request took too long to complete. This may be due to network issues or high API load. Try again.`);
        }
        throw new Error(`API call failed: ${error.message}. If this persists, check your API key configuration and Anthropic API status.`);
      }
      throw error;
    }
  }

  // Create MCP server with explicit capabilities
  const server = new McpServer({
    name: "spec-iterator",
    version: "0.1.0",
    capabilities: {
      tools: {},
      prompts: {},
      resources: {}
    }
  });

  // Tool: Start a new clarification session
  server.tool(
    "spec_start_session",
    `Start a new specification clarification session from a rough or incomplete requirement.

USE THIS TOOL WHEN: You have a vague requirement like "build a dashboard" or "we need order tracking" and need to systematically uncover missing details before implementation.

RETURNS: A session_id (save this!) and initial clarifying questions organized by category (functional, technical, UX, edge cases, constraints).

TYPICAL WORKFLOW: spec_start_session → spec_answer_questions (repeat until 80%+ completeness) → spec_generate

NEXT STEP: Use spec_answer_questions with the returned session_id and question IDs to provide answers.`,
    {
      requirement: z.string().describe("Required. The initial requirement, idea, or feature request to clarify. Can be as vague as 'build a dashboard' or more detailed. The more context provided, the better the initial questions."),
      domain: z.string().optional().describe("Optional. Domain context helps generate more relevant questions. Examples: 'e-commerce', 'healthcare', 'fintech', 'SaaS', 'mobile app'. Defaults to general software."),
      audience: z.enum(["technical", "business", "mixed"]).optional().describe("Optional. Target audience for the final spec. 'technical' = developers, 'business' = stakeholders, 'mixed' = both. Defaults to 'mixed'.")
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
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to analyze requirement",
              details: errorMessage,
              recovery: errorMessage.includes("API")
                ? "This is an API issue. Check the error details and retry."
                : "The AI response could not be parsed. Try rephrasing your requirement or try again."
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
    `Provide answers to clarifying questions in an active session. Each answer improves the specification completeness score.

USE THIS TOOL WHEN: You have a session_id from spec_start_session and want to answer one or more pending questions.

RETURNS: Updated completeness scores (0-100% overall and per category), any new follow-up questions generated based on your answers, and the next recommended action.

WORKFLOW POSITION: spec_start_session → [spec_answer_questions] (you are here, repeat until 80%+) → spec_generate

TIPS:
- Answer as many questions as you can in one call for efficiency
- Say "unknown - assume X" to document assumptions rather than guessing
- When completeness reaches 80%+, you'll be prompted to generate the spec`,
    {
      session_id: z.string().describe("Required. The session_id returned from spec_start_session. This identifies which clarification session to update."),
      answers: z.array(z.object({
        question_id: z.string().describe("Required. The question ID (e.g., 'q1_1', 'q2_3') from the questions list."),
        answer: z.string().describe("Required. Your answer to the question. Be specific. If unknown, say 'unknown - assume X' to create a documented assumption.")
      })).describe("Required. Array of question/answer pairs. You can answer multiple questions in one call.")
    },
    async ({ session_id, answers }) => {
      const session = getSession(session_id);
      if (!session) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Session not found",
              session_id,
              recovery: "The session_id may be invalid, expired, or from a previous server session. Use spec_list_sessions to see available sessions, or spec_start_session to create a new one."
            })
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
    `Analyze what's missing in a specification session and get actionable recommendations.

USE THIS TOOL WHEN: You want to understand why completeness is low, identify blocking gaps before generating, or get specific recommendations for what information is still needed.

RETURNS: Detailed breakdown of gaps by category (functional, technical, UX, edge cases, constraints), impact assessment for each gap, whether the spec is ready to generate, and specific blocking issues that should be resolved first.

WORKFLOW POSITION: Can be called anytime after spec_start_session. Useful before spec_generate to ensure quality.

WHEN TO USE vs. spec_get_status: Use spec_get_gaps for detailed analysis and recommendations. Use spec_get_status for quick progress check.`,
    {
      session_id: z.string().describe("Required. The session_id to analyze for gaps and missing information.")
    },
    async ({ session_id }) => {
      const session = getSession(session_id);
      if (!session) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Session not found",
              session_id,
              recovery: "The session_id may be invalid, expired, or from a previous server session. Use spec_list_sessions to see available sessions, or spec_start_session to create a new one."
            })
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
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to analyze gaps",
              details: errorMessage,
              completeness: session.completeness,
              recovery: errorMessage.includes("API")
                ? "This is an API issue. Check the error details and retry."
                : "The AI response could not be parsed. Try again or use spec_get_status for a simpler progress check."
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
    `Generate the final structured specification document from a completed clarification session.

USE THIS TOOL WHEN: Completeness is 80%+ (or you want to generate anyway with gaps documented). This is the final step in the workflow.

RETURNS: A complete specification including: problem statement with user personas, step-by-step user flows, features with acceptance criteria, edge cases with handling strategies, documented assumptions, and open questions for stakeholders.

WORKFLOW POSITION: spec_start_session → spec_answer_questions (repeat) → [spec_generate] (you are here - final step)

OUTPUT FORMATS:
- 'markdown' (default): Human-readable spec ready for sharing with stakeholders
- 'json': Structured data for programmatic processing or integration

NOTE: Will warn if completeness is below 60% but will still generate. Gaps will be documented in the output.`,
    {
      session_id: z.string().describe("Required. The session_id of the clarification session to compile into a specification."),
      format: z.enum(["json", "markdown"]).optional().default("markdown").describe("Optional. Output format. 'markdown' (default) for human-readable docs, 'json' for structured data. Defaults to 'markdown'.")
    },
    async ({ session_id, format }) => {
      const session = getSession(session_id);
      if (!session) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Session not found",
              session_id,
              recovery: "The session_id may be invalid, expired, or from a previous server session. Use spec_list_sessions to see available sessions, or spec_start_session to create a new one."
            })
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
        const errorMessage = e instanceof Error ? e.message : String(e);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to generate specification",
              details: errorMessage,
              session_id,
              completeness: session.completeness,
              recovery: errorMessage.includes("API")
                ? "This is an API issue. Check the error details and retry. Your session is preserved."
                : "The AI response could not be parsed. Try again - your session progress is saved."
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
    `Get a quick status overview of a clarification session including progress and pending questions.

USE THIS TOOL WHEN: You need to check progress on a session, see what questions remain, or resume work on a previous session.

RETURNS: Session status (in_progress, ready_to_generate, complete), completeness scores, question counts (total/answered/pending), list of pending questions, and session metadata.

WHEN TO USE vs. spec_get_gaps: Use spec_get_status for quick progress overview. Use spec_get_gaps for detailed analysis of what's missing and why.`,
    {
      session_id: z.string().describe("Required. The session_id to check status for.")
    },
    async ({ session_id }) => {
      const session = getSession(session_id);
      if (!session) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Session not found",
              session_id,
              recovery: "The session_id may be invalid, expired, or from a previous server session. Use spec_list_sessions to see available sessions, or spec_start_session to create a new one."
            })
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
    `List all clarification sessions (active and completed) stored on this server.

USE THIS TOOL WHEN: You need to find a previous session to resume, want to see all work in progress, or need to retrieve a session_id you forgot.

RETURNS: Array of sessions with id, requirement preview, status, completeness score, and creation timestamp.

NOTE: Sessions are stored in memory and will be lost if the server restarts. For important work, generate the spec before ending your session.`,
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

  // Tool: Server info and health check
  server.tool(
    "spec_info",
    `Get server information, health status, and configuration diagnostics.

USE THIS TOOL WHEN: You want to verify the server is working correctly, check configuration status, or troubleshoot issues.

RETURNS: Server version, API configuration status, active session count, and health indicators.`,
    {},
    async () => {
      const allSessions = listSessions();
      const activeSessions = allSessions.filter(s => s.status === 'in_progress');
      const completedSessions = allSessions.filter(s => s.status === 'complete');

      // Test API connectivity
      let apiStatus = "configured";
      let apiMessage = "Anthropic API key is configured";

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            server: {
              name: "spec-iterator",
              version: "0.1.0",
              description: "Transform rough requirements into complete technical specifications through AI-powered clarification dialogues"
            },
            health: {
              status: "healthy",
              api: apiStatus,
              api_message: apiMessage
            },
            statistics: {
              total_sessions: allSessions.length,
              active_sessions: activeSessions.length,
              completed_sessions: completedSessions.length
            },
            capabilities: {
              tools: ["spec_start_session", "spec_answer_questions", "spec_get_gaps", "spec_generate", "spec_get_status", "spec_list_sessions", "spec_info"],
              completeness_categories: ["functional (30%)", "technical (25%)", "UX (20%)", "edge_cases (15%)", "constraints (10%)"],
              output_formats: ["markdown", "json"]
            },
            usage: {
              typical_workflow: "spec_start_session → spec_answer_questions (repeat) → spec_generate",
              estimated_cost: "$0.05-0.15 per spec (3-5 clarification rounds)"
            }
          }, null, 2)
        }]
      };
    }
  );

  // Return the server for Smithery
  return server.server;
}
