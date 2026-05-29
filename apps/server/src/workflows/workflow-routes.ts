import type { WorkflowDefinition } from "@agentdeck/workflow-core";

import {
  WorkflowValidationError,
  type WorkflowRegistryService,
  type WorkflowUpdateInput,
} from "./workflow-service.js";

export type WorkflowRouteResponse<TBody extends object = object> = TBody & {
  readonly status: number;
};

export type WorkflowMutationResponse = WorkflowRouteResponse<
  | { readonly workflow: WorkflowDefinition }
  | { readonly errors: readonly string[] }
  | { readonly error: string }
>;

export interface WorkflowRoutes {
  readonly createWorkflow: (workflow: WorkflowDefinition) => Promise<WorkflowMutationResponse>;
  readonly listWorkflows: () => Promise<
    WorkflowRouteResponse<{ readonly workflows: readonly WorkflowDefinition[] }>
  >;
  readonly getWorkflow: (input: {
    readonly id: string;
  }) => Promise<
    WorkflowRouteResponse<{ readonly workflow: WorkflowDefinition } | { readonly error: string }>
  >;
  readonly updateWorkflow: (input: {
    readonly id: string;
    readonly workflow: WorkflowUpdateInput;
  }) => Promise<WorkflowMutationResponse>;
  readonly deleteWorkflow: (input: {
    readonly id: string;
  }) => Promise<WorkflowRouteResponse<{ readonly deleted: true } | { readonly error: string }>>;
}

export function createWorkflowRoutes(input: {
  readonly service: WorkflowRegistryService;
}): WorkflowRoutes {
  return {
    async createWorkflow(workflow) {
      try {
        return {
          status: 201,
          workflow: await input.service.create(workflow),
        };
      } catch (error) {
        return mapRouteError(error);
      }
    },
    async listWorkflows() {
      return {
        status: 200,
        workflows: await input.service.list(),
      };
    },
    async getWorkflow({ id }) {
      const workflow = await input.service.get(id);
      if (!workflow) {
        return {
          status: 404,
          error: `Workflow "${id}" was not found.`,
        };
      }

      return {
        status: 200,
        workflow,
      };
    },
    async updateWorkflow({ id, workflow }) {
      try {
        return {
          status: 200,
          workflow: await input.service.update(id, workflow),
        };
      } catch (error) {
        return mapRouteError(error);
      }
    },
    async deleteWorkflow({ id }) {
      const deleted = await input.service.delete(id);
      if (!deleted) {
        return {
          status: 404,
          error: `Workflow "${id}" was not found.`,
        };
      }

      return {
        status: 204,
        deleted: true,
      };
    },
  };
}

function mapRouteError(
  error: unknown,
): WorkflowRouteResponse<{ readonly errors: readonly string[] } | { readonly error: string }> {
  if (error instanceof WorkflowValidationError) {
    return {
      status: 400,
      errors: error.errors,
    };
  }

  if (error instanceof Error && /Workflow ".+" was not found\./.test(error.message)) {
    return {
      status: 404,
      error: error.message,
    };
  }

  throw error;
}
