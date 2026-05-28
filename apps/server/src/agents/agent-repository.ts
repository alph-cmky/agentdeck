import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { PersistedAgentDefinition } from "./agent-schema.js";

export interface AgentRepository {
  readonly list: () => Promise<PersistedAgentDefinition[]>;
  readonly get: (id: string) => Promise<PersistedAgentDefinition | undefined>;
  readonly save: (agent: PersistedAgentDefinition) => Promise<void>;
  readonly delete: (id: string) => Promise<boolean>;
}

interface AgentStoreFile {
  readonly agents: readonly PersistedAgentDefinition[];
}

export function createFileAgentRepository(storePath: string): AgentRepository {
  return {
    async list() {
      return await readAgents(storePath);
    },
    async get(id) {
      const agents = await readAgents(storePath);
      return agents.find((agent) => agent.id === id);
    },
    async save(agent) {
      const agents = await readAgents(storePath);
      const nextAgents = [...agents.filter((existing) => existing.id !== agent.id), agent].sort(
        (left, right) => left.id.localeCompare(right.id),
      );
      await writeAgents(storePath, nextAgents);
    },
    async delete(id) {
      const agents = await readAgents(storePath);
      const nextAgents = agents.filter((agent) => agent.id !== id);

      if (nextAgents.length === agents.length) {
        return false;
      }

      await writeAgents(storePath, nextAgents);
      return true;
    },
  };
}

async function readAgents(storePath: string): Promise<PersistedAgentDefinition[]> {
  try {
    const contents = await readFile(storePath, "utf8");
    const parsed = JSON.parse(contents) as AgentStoreFile;
    return [...(parsed.agents ?? [])];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeAgents(
  storePath: string,
  agents: readonly PersistedAgentDefinition[],
): Promise<void> {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(
    storePath,
    `${JSON.stringify(
      {
        agents,
      } satisfies AgentStoreFile,
      null,
      2,
    )}\n`,
  );
}
