import { detectCliRuntime, type DetectCliRuntimeOptions } from "./cli-runtime.js";

export type DetectCodeRuntimeOptions = DetectCliRuntimeOptions;

export async function detectCodeRuntime(options: DetectCodeRuntimeOptions = {}) {
  return await detectCliRuntime(
    {
      id: "code",
      name: "Visual Studio Code CLI",
      binary: "code",
      versionCommand: "code --version",
      capabilities: { exec: true },
    },
    options,
  );
}
