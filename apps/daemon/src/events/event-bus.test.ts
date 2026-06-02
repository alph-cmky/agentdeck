import { describe, expect, it } from "vitest";

import { createEventBus } from "./event-bus.js";
import type { DaemonEvent } from "./event-types.js";

function taskStartedEvent(id: string): DaemonEvent {
  return {
    id,
    type: "task.started",
    createdAt: "2026-05-28T00:00:00.000Z",
    payload: {
      taskId: "task-1",
      title: "Run workflow",
    },
  };
}

describe("createEventBus", () => {
  it("broadcasts events to multiple subscribers", () => {
    const bus = createEventBus();
    const first: DaemonEvent[] = [];
    const second: DaemonEvent[] = [];

    bus.subscribe((event) => first.push(event));
    bus.subscribe((event) => second.push(event));
    bus.publish(taskStartedEvent("event-1"));

    expect(first.map((event) => event.id)).toEqual(["event-1"]);
    expect(second.map((event) => event.id)).toEqual(["event-1"]);
    expect(bus.subscriberCount()).toBe(2);
  });

  it("removes subscribers when they unsubscribe", () => {
    const bus = createEventBus();
    const received: DaemonEvent[] = [];

    const subscription = bus.subscribe((event) => received.push(event));
    expect(bus.subscriberCount()).toBe(1);

    subscription.unsubscribe();
    bus.publish(taskStartedEvent("event-2"));

    expect(received).toEqual([]);
    expect(bus.subscriberCount()).toBe(0);
  });
});
