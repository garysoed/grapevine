import { DelayedObservable } from './delayed-observable';
import { DelayedSubject } from './delayed-subject';
import { Vine } from './vine';

export function injectVine<T>(vine: Vine, instance: T): T {
  // tslint:disable-next-line: forin
  for (const key in instance) {
    const value = instance[key];
    if (value instanceof DelayedObservable) {
      value.setContext(vine);
    }

    if (value instanceof DelayedSubject) {
      value.setContext(vine);
    }
  }

  return instance;
}
