import { detectCliRuntime, type DetectCliRuntimeOptions } from "./cli-runtime.js";

export type DetectGitRuntimeOptions = DetectCliRuntimeOptions;

export async function detectGitRuntime(options: DetectGitRuntimeOptions = {}) {
  return await detectCliRuntime(
    {
      id: "git",
      name: "Git",
      binary: "git",
      versionCommand: "git --version",
      capabilities: {},
    },
    options,
  );
}
