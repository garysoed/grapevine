import { DelayedObservable } from './delayed_observable';
import { DelayedSubject } from './delayed_subject';
import { Vine } from './vine';

export function newInstance<A extends any[], T>(
    vine: Vine,
    ctor: new (...args: A) => T,
    ...args: A): T {
  const instance = new ctor(...args);
  // tslint:disable-next-line: forin
  for (const key in instance) {
    const value = instance[key];
    if (value instanceof DelayedObservable) {
      value.setVine(vine);
    }

    if (value instanceof DelayedSubject) {
      value.setVine(vine);
    }
  }

  return instance;
}
