import {Id, __unused} from './id';
import {Vine, __getOrInit} from './vine';

export class Source<T> implements Id<T> {
  readonly [__unused] = {};

  constructor(readonly provider: (vine: Vine) => T) {}
  get(vine: Vine): T {
    return vine[__getOrInit](this, this.provider);
  }
}

export function source<T>(
  valueProvider: ((vine: Vine) => T) | string,
): Source<T> {
  if (typeof valueProvider === 'string') {
    return new Source(() => {
      throw new Error(`Key ${valueProvider} is not provided`);
    });
  }
  return new Source(valueProvider);
}
