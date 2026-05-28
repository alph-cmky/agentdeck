import {
  detectLocalProviderRuntime,
  type DetectLocalProviderRuntimeOptions,
} from "./cli-runtime.js";

export type DetectOllamaRuntimeOptions = DetectLocalProviderRuntimeOptions;

export async function detectOllamaRuntime(options: DetectOllamaRuntimeOptions = {}) {
  return await detectLocalProviderRuntime(
    {
      id: "ollama",
      name: "Ollama",
      binary: "ollama",
      versionCommand: "ollama --version",
      capabilities: { chat: true },
    },
    options,
  );
}
