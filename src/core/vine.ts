import {$asMap, $map} from 'gs-tools/export/collect';
import {$pipe} from 'gs-tools/export/typescript';

import {Id} from './id';
import {UNINITIALIZED_SOURCE_NAMES} from './source';

export const __getOrInit = Symbol('getOrInit');
const __override = Symbol('override');

export interface Override<T> {
  readonly [__override]: unknown;
  readonly override: Id<T>;
  readonly withValue: T;
}

export function override<T>(id: Id<T>, value: T): Override<T> {
  return {
    [__override]: 'override',
    override: id,
    withValue: value,
  };
}

export interface Config {
  readonly overrides?: ReadonlyArray<Override<any>>;
}

export class Vine {
  private readonly cache = this.initCache();

  constructor(private readonly config: Config = {}) {
    this.checkUninitializedSources(config.overrides ?? []);
  }

  [__getOrInit]<T>(key: Id<T>, provider: (vine: Vine) => T): T {
    const cachedValue = this.cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = provider(this);
    this.cache.set(key, value);
    return value;
  }

  private checkUninitializedSources(
    overrides: ReadonlyArray<Override<unknown>>,
  ): void {
    const uninitializedSourceNames = new Set<string | null>([
      ...UNINITIALIZED_SOURCE_NAMES,
    ]);
    for (const {override} of overrides) {
      uninitializedSourceNames.delete(override.name);
    }

    if (uninitializedSourceNames.size <= 0) {
      return;
    }

    throw new Error(
      `Uninitialized sources found: ${[...uninitializedSourceNames].join(
        ', ',
      )}`,
    );
  }

  private initCache(): Map<unknown, any> {
    return new Map(
      $pipe(
        this.config.overrides ?? [],
        $map(({override, withValue}) => [override, withValue] as const),
        $asMap(),
      ),
    );
  }
}
