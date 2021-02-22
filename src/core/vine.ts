import {$asMap, $map, $pipe} from 'gs-tools/export/collect';

import {Id} from './id';


export const __getOrInit = Symbol('getOrInit');


export interface Override<T> {
  readonly override: Id<T>;
  readonly withValue: T;
}

export interface Config {
  readonly appName: string;
  readonly overrides?: ReadonlyArray<Override<any>>;
}

export class Vine {
  private readonly cache = this.initCache();

  constructor(private readonly config: Config) { }

  [__getOrInit]<T>(key: Id<T>, provider: (vine: Vine) => T): T {
    const cachedValue = this.cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = provider(this);
    this.cache.set(key, value);
    return value;
  }

  private initCache(): Map<unknown, any> {
    return $pipe(
        this.config.overrides ?? [],
        $map(({override, withValue}) => [override, withValue] as const),
        $asMap(),
    );
  }

  get appName(): string {
    return this.config.appName;
  }
}
