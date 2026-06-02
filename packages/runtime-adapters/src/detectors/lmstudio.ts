import {
  detectLocalProviderRuntime,
  type DetectLocalProviderRuntimeOptions,
} from "./cli-runtime.js";

export type DetectLmStudioRuntimeOptions = DetectLocalProviderRuntimeOptions;

export async function detectLmStudioRuntime(options: DetectLmStudioRuntimeOptions = {}) {
  return await detectLocalProviderRuntime(
    {
      id: "lmstudio",
      name: "LM Studio",
      binary: "lms",
      versionCommand: "lms --version",
      capabilities: { chat: true },
    },
    options,
  );
}
