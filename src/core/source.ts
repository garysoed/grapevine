import {Id, __unused} from './id';
import {Vine, __getOrInit} from './vine';

const _UNINITIALIZED_SOURCE_NAMES = new Set<string>();
export const UNINITIALIZED_SOURCE_NAMES: ReadonlySet<string> =
  _UNINITIALIZED_SOURCE_NAMES;

export class Source<T> implements Id<T> {
  readonly [__unused] = {};

  constructor(
    readonly provider: (vine: Vine) => T,
    readonly name: string | null,
  ) {}

  get(vine: Vine): T {
    return vine[__getOrInit](this, this.provider);
  }
}

export function source<T>(
  valueProvider: ((vine: Vine) => T) | string,
): Source<T> {
  if (typeof valueProvider !== 'string') {
    return new Source(valueProvider, null);
  }

  _UNINITIALIZED_SOURCE_NAMES.add(valueProvider);
  return new Source(() => {
    throw new Error(`Key ${valueProvider} is not provided`);
  }, valueProvider);
}
