import {cached} from 'gs-tools/export/data';

import {Id} from '../core/id';
import {Override, override} from '../core/vine';

export abstract class OverridesBuilder {
  constructor(
    private readonly defaultOverrideIds: ReadonlyArray<Id<unknown>>,
  ) {}

  protected abstract getOverride(id: Id<unknown>): unknown;

  protected addOverride<T>(id: Id<T>): T {
    const overrideInstance = this.getOverride(id);
    this.overridesCache.set(id, override(id, overrideInstance));
    return overrideInstance as T;
  }

  @cached()
  private get overridesCache(): Map<Id<unknown>, Override<unknown>> {
    return new Map<Id<unknown>, Override<unknown>>(
      this.defaultOverrideIds.map((id) => {
        return [id, override(id, this.getOverride(id))];
      }),
    );
  }

  get overrides(): ReadonlyArray<Override<unknown>> {
    return [...this.overridesCache.values()];
  }
}
