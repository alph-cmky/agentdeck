import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@agentdeck/workflow-core": fileURLToPath(
        new URL("./packages/workflow-core/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**", ".worktrees/**"],
    passWithNoTests: true,
  },
});
