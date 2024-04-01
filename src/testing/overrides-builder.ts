import {CachedValue} from 'gs-tools/export/data';

import {Id} from '../core/id';
import {Override, override} from '../core/vine';

export abstract class OverridesBuilder {
  readonly overridesCache = new CachedValue<
    Map<Id<unknown>, Override<unknown>>
  >(() => {
    return new Map<Id<unknown>, Override<unknown>>(
      this.defaultOverrideIds.map((id) => {
        return [id, override(id, this.getOverride(id))];
      }),
    );
  });

  constructor(
    private readonly defaultOverrideIds: ReadonlyArray<Id<unknown>>,
  ) {}

  protected abstract getOverride(id: Id<unknown>): unknown;

  protected addOverride<T>(id: Id<T>): T {
    const overrideInstance = this.getOverride(id);
    this.overridesCache.value.set(id, override(id, overrideInstance));
    return overrideInstance as T;
  }

  get overrides(): ReadonlyArray<Override<unknown>> {
    return [...this.overridesCache.value.values()];
  }
}
