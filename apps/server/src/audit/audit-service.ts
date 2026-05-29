import type {
  AuditEntry,
  AuditMetadata,
  AuditMetadataValue,
  CreateAuditEntryInput,
} from "./audit-schema.js";

export interface AuditLogService {
  readonly record: (input: CreateAuditEntryInput) => Promise<AuditEntry>;
  readonly list: () => Promise<readonly AuditEntry[]>;
  readonly findByTask: (taskId: string) => Promise<readonly AuditEntry[]>;
  readonly findByRuntime: (runtimeId: string) => Promise<readonly AuditEntry[]>;
  readonly findByActor: (actorId: string) => Promise<readonly AuditEntry[]>;
}

export interface CreateAuditLogServiceOptions {
  readonly now?: () => string;
  readonly nextId?: () => string;
}

const SECRET_KEY_PATTERN = /^(api[_-]?key|token|password|secret)$/i;

export function createAuditLogService(options: CreateAuditLogServiceOptions = {}): AuditLogService {
  const entries: AuditEntry[] = [];
  const now = options.now ?? (() => new Date().toISOString());
  const nextId = options.nextId ?? (() => crypto.randomUUID());

  return {
    async record(input) {
      const entry: AuditEntry = {
        ...redactAuditInput(input),
        id: nextId(),
        createdAt: now(),
      };
      entries.push(entry);
      return cloneJson(entry);
    },
    async list() {
      return cloneJson(entries);
    },
    async findByTask(taskId) {
      return cloneJson(entries.filter((entry) => entry.taskId === taskId));
    },
    async findByRuntime(runtimeId) {
      return cloneJson(entries.filter((entry) => entry.runtimeId === runtimeId));
    },
    async findByActor(actorId) {
      return cloneJson(entries.filter((entry) => entry.actor.id === actorId));
    },
  };
}

function redactAuditInput(input: CreateAuditEntryInput): CreateAuditEntryInput {
  return {
    ...input,
    ...(input.commandSummary ? { commandSummary: redactText(input.commandSummary) } : {}),
    ...(input.diffSummary ? { diffSummary: redactText(input.diffSummary) } : {}),
    ...(input.metadata ? { metadata: redactMetadata(input.metadata) } : {}),
  };
}

function redactMetadata(metadata: AuditMetadata): AuditMetadata {
  return redactMetadataValue(metadata) as AuditMetadata;
}

function redactMetadataValue(value: AuditMetadataValue, key = ""): AuditMetadataValue {
  if (SECRET_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return redactText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactMetadataValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redactMetadataValue(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

function redactText(value: string): string {
  return value
    .replace(/\b(api[_-]?key\s*[:=]\s*)([^\s,]+)/gi, "$1[REDACTED]")
    .replace(/\b(token\s*[:=]\s*)([^\s,]+)/gi, "$1[REDACTED]")
    .replace(/\b(password\s*[:=]\s*)([^\s,]+)/gi, "$1[REDACTED]")
    .replace(/\b(secret\s*[:=]\s*)([^\s,]+)/gi, "$1[REDACTED]");
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
