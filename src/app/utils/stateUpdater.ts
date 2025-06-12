import { createBehaviorSubject, Stream } from '@actioncrew/streamix';

export interface StateUpdater<T> {
  value: T;
  subject: Stream<T>;
  set: (next: T) => void;
  update: (updater: (current: T) => T) => void;
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
    subject,
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
