import { ImmutableSet } from 'gs-tools/export/collect';
import { cache } from 'gs-tools/export/data';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { InstanceSourceId } from '../component/instance-source-id';
import { Time } from '../component/time';
import { InstanceNode } from './instance-node';
import { Listener } from './listener';

/**
 * Node whose value can be updated.
 */
export class InstanceSourceNode<T> extends InstanceNode<T> {
  private readonly listeners_: Map<BaseDisposable, Set<Listener<T>>> = new Map();

  constructor(
      id: InstanceSourceId<T>,
      initTime: Time,
      private readonly initValue_: T) {
    super(initTime, id);
  }

  protected async computeValue_(): Promise<T> {
    return this.initValue_;
  }

  @cache()
  getSources(): ImmutableSet<InstanceSourceNode<any>> {
    return ImmutableSet.of([this]);
  }

  listen(listener: Listener<T>, context: BaseDisposable): () => void {
    const listeners = this.listeners_.get(context) || new Set();
    listeners.add(listener);
    this.listeners_.set(context, listeners);

    return () => listeners.delete(listener);
  }

  setValue(newValue: T, context: BaseDisposable, time: Time): void {
    this.nodeCache_.setCachedValue(Promise.resolve(newValue), context, time);
    for (const listener of this.listeners_.get(context) || new Set()) {
      listener(newValue);
    }
  }
}
