import {Id} from '../core/id';
import {Override, override} from '../core/vine';

export abstract class OverridesBuilder {
  readonly #overrides = new Map<Id<unknown>, Override<unknown>>(
    this.defaultOverrideIds.map((id) => {
      return [id, override(id, this.getOverride(id))];
    }),
  );

  constructor(
    private readonly defaultOverrideIds: ReadonlyArray<Id<unknown>>,
  ) {}

  protected abstract getOverride(id: Id<unknown>): unknown;

  protected addOverride<T>(id: Id<T>): T {
    const overrideInstance = this.getOverride(id);
    this.#overrides.set(id, override(id, overrideInstance));
    return overrideInstance as T;
  }

  get overrides(): ReadonlyArray<Override<unknown>> {
    return [...this.#overrides.values()];
  }
}
