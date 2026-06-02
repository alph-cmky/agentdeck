import { detectCliRuntime, type DetectCliRuntimeOptions } from "./cli-runtime.js";

export type DetectClaudeRuntimeOptions = DetectCliRuntimeOptions;

export async function detectClaudeRuntime(options: DetectClaudeRuntimeOptions = {}) {
  return await detectCliRuntime(
    {
      id: "claude",
      name: "Claude Code",
      binary: "claude",
      versionCommand: "claude --version",
      capabilities: { exec: true },
    },
    options,
  );
}
