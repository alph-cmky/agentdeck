import type {
  AgentRegistryService,
  PersistedAgentDefinition,
  WorkflowRegistryService,
} from "@agentdeck/server";
import type { WorkflowDefinition } from "@agentdeck/workflow-core";

export interface McpToolInputSchema {
  readonly type: "object";
  readonly properties: Readonly<Record<string, unknown>>;
  readonly required?: readonly string[];
  readonly additionalProperties: boolean;
}

export interface AgentDeckMcpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: McpToolInputSchema;
}

export type AgentDeckMcpToolResult =
  | { readonly agents: readonly PersistedAgentDefinition[] }
  | { readonly workflows: readonly WorkflowDefinition[] }
  | { readonly workflow: WorkflowDefinition };

export interface AgentDeckToolRegistry {
  readonly listTools: () => readonly AgentDeckMcpTool[];
  readonly callTool: (name: string, input: unknown) => Promise<AgentDeckMcpToolResult>;
}

export interface CreateAgentDeckToolRegistryOptions {
  readonly agentRegistry: Pick<AgentRegistryService, "list">;
  readonly workflowRegistry: Pick<WorkflowRegistryService, "list" | "get">;
}

type ToolHandler = (input: unknown) => Promise<AgentDeckMcpToolResult>;

interface ToolDefinition extends AgentDeckMcpTool {
  readonly handler: ToolHandler;
}

const EMPTY_INPUT_SCHEMA: McpToolInputSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

const GET_WORKFLOW_INPUT_SCHEMA: McpToolInputSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
  },
  required: ["id"],
  additionalProperties: false,
};

export function createAgentDeckToolRegistry(
  options: CreateAgentDeckToolRegistryOptions,
): AgentDeckToolRegistry {
  const tools: readonly ToolDefinition[] = [
    {
      name: "agentdeck.listAgents",
      description: "List configured AgentDeck agents.",
      inputSchema: EMPTY_INPUT_SCHEMA,
      async handler() {
        return { agents: await options.agentRegistry.list() };
      },
    },
    {
      name: "agentdeck.listWorkflows",
      description: "List persisted AgentDeck workflows.",
      inputSchema: EMPTY_INPUT_SCHEMA,
      async handler() {
        return { workflows: await options.workflowRegistry.list() };
      },
    },
    {
      name: "agentdeck.getWorkflow",
      description: "Get one persisted AgentDeck workflow by ID.",
      inputSchema: GET_WORKFLOW_INPUT_SCHEMA,
      async handler(input) {
        const id = readStringInput(input, "id");
        const workflow = await options.workflowRegistry.get(id);
        if (!workflow) {
          throw new Error(`Workflow "${id}" was not found.`);
        }

        return { workflow };
      },
    },
  ];
  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));

  return {
    listTools() {
      return tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
    },
    async callTool(name, input) {
      const tool = toolsByName.get(name);
      if (!tool) {
        throw new Error(`MCP tool "${name}" is not registered.`);
      }

      return await tool.handler(input);
    },
  };
}

function readStringInput(input: unknown, key: string): string {
  if (!isRecord(input) || typeof input[key] !== "string" || !input[key].trim()) {
    throw new Error(`MCP tool input "${key}" must be a non-empty string.`);
  }

  return input[key].trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
