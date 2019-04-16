import { __inject, isInjectable } from '../types/injectable';
import { Vine } from './vine';

export function injectVine<T>(vine: Vine, instance: T): T {
  // tslint:disable-next-line: forin
  for (const key in instance) {
    const value = instance[key];
    if (isInjectable(value)) {
      value[__inject](vine);
    }
  }

  return instance;
}
