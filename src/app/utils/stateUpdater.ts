import { createBehaviorSubject, Receiver, Stream, Subscription } from '@actioncrew/streamix';

export interface StateUpdater<T> {
  get value(): T;
  set: (next: T) => void;
  update: (updater: (current: T) => T) => void;
  subscribe: (callbackOrReceiver?: ((value: T) => void) | Receiver<T>) => Subscription;
}

export function createUpdater<T>(initial: T): StateUpdater<T> {
  let current = initial;
  let subject = createBehaviorSubject(initial);

  return {
    get value() {
      return current;
    },
    set value(next) {
      current = next;
      subject.next(next);
    },
    subscribe: subject.subscribe.bind(subject),
    set(next) {
      current = next;
      subject.next(next);
    },
    update(fn) {
      const next = fn(current);
      current = next;
      subject.next(next);
    }
  };
}
