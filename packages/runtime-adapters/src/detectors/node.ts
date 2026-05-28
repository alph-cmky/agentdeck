import { detectCliRuntime, type DetectCliRuntimeOptions } from "./cli-runtime.js";

export type DetectNodeRuntimeOptions = DetectCliRuntimeOptions;

export async function detectNodeRuntime(options: DetectNodeRuntimeOptions = {}) {
  return await detectCliRuntime(
    {
      id: "node",
      name: "Node.js",
      binary: "node",
      versionCommand: "node --version",
      capabilities: { exec: true },
    },
    options,
  );
}
