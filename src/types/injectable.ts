import { Vine } from '../core/vine';

export const __inject = Symbol('inject');

export interface Injectable {
  [__inject](vine: Vine): void;
}

export function isInjectable(o: any): o is Injectable {
  return o[__inject] instanceof Function;
}
