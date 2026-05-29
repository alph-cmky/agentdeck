import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { WorkflowDefinition } from "@agentdeck/workflow-core";

export interface WorkflowRepository {
  readonly list: () => Promise<WorkflowDefinition[]>;
  readonly get: (id: string) => Promise<WorkflowDefinition | undefined>;
  readonly save: (workflow: WorkflowDefinition) => Promise<void>;
  readonly delete: (id: string) => Promise<boolean>;
}

export function createFileWorkflowRepository(storePath: string): WorkflowRepository {
  return {
    async list() {
      return Object.values(await readStore(storePath)).sort((left, right) =>
        left.id.localeCompare(right.id),
      );
    },
    async get(id) {
      const store = await readStore(storePath);
      return store[id];
    },
    async save(workflow) {
      const store = await readStore(storePath);
      store[workflow.id] = workflow;
      await writeStore(storePath, store);
    },
    async delete(id) {
      const store = await readStore(storePath);
      if (!store[id]) {
        return false;
      }

      delete store[id];
      await writeStore(storePath, store);
      return true;
    },
  };
}

async function readStore(storePath: string): Promise<Record<string, WorkflowDefinition>> {
  try {
    const raw = await readFile(storePath, "utf8");
    return JSON.parse(raw) as Record<string, WorkflowDefinition>;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeStore(
  storePath: string,
  store: Readonly<Record<string, WorkflowDefinition>>,
): Promise<void> {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}
