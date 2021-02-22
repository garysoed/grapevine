import {Id, __unused} from './id';
import {Vine, __getOrInit} from './vine';


export class Source<T> implements Id<T> {
  readonly [__unused] = {};

  constructor(
      readonly key: string,
      readonly provider: (vine: Vine) => T,
  ) { }

  get(vine: Vine): T {
    return vine[__getOrInit](this, this.provider);
  }
}

export function source<T>(
    key: string,
    valueProvider: (vine: Vine) => T,
): Source<T> {
  return new Source(key, valueProvider);
}
