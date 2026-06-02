import { describe, expect, it } from "vitest";

import { DAEMON_EVENT_TYPES } from "./event-types.js";

describe("DAEMON_EVENT_TYPES", () => {
  it("defines all MVP daemon event types", () => {
    expect(DAEMON_EVENT_TYPES).toEqual([
      "runtime.detected",
      "task.started",
      "task.output",
      "task.diff",
      "task.approvalRequested",
      "task.completed",
      "task.failed",
    ]);
  });
});
