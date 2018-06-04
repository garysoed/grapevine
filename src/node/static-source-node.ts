import { ImmutableSet } from 'gs-tools/export/collect';
import { cache } from 'gs-tools/export/data';
import { StaticSourceId } from '../component/static-source-id';
import { Time } from '../component/time';
import { GLOBAL_CONTEXT } from './global-context';
import { Listener } from './listener';
import { StaticNode } from './static-node';

/**
 * Node whose value can be updated.
 */
export class StaticSourceNode<T> extends StaticNode<T> {
  private readonly listeners_: Set<Listener<T>> = new Set();

  constructor(
      id: StaticSourceId<T>,
      initTime: Time,
      private readonly initValue_: T) {
    super(initTime, id);
  }

  protected async computeValue_(time: Time): Promise<T> {
    return this.initValue_;
  }

  @cache()
  getSources(): ImmutableSet<StaticSourceNode<any>> {
    return ImmutableSet.of([this]);
  }

  listen(listener: Listener<T>): () => void {
    this.listeners_.add(listener);

    return () => this.listeners_.delete(listener);
  }

  setValue(newValue: T, time: Time): void {
    this.nodeCache_.setCachedValue(Promise.resolve(newValue), GLOBAL_CONTEXT, time);
    for (const listener of this.listeners_) {
      listener(newValue);
    }
  }
}
