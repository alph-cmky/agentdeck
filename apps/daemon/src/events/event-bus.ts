import type { DaemonEvent } from "./event-types.js";

export interface EventSubscription {
  readonly unsubscribe: () => void;
}

export interface EventBus {
  readonly publish: (event: DaemonEvent) => void;
  readonly subscribe: (listener: (event: DaemonEvent) => void) => EventSubscription;
  readonly subscriberCount: () => number;
}

export function createEventBus(): EventBus {
  const listeners = new Set<(event: DaemonEvent) => void>();

  return {
    publish(event) {
      for (const listener of listeners) {
        listener(event);
      }
    },
    subscribe(listener) {
      listeners.add(listener);

      return {
        unsubscribe() {
          listeners.delete(listener);
        },
      };
    },
    subscriberCount() {
      return listeners.size;
    },
  };
}
