import { ImmutableSet } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NodeId } from '../component/node-id';
import { Time } from '../component/time';
import { NodeCache } from './node-cache';
import { SourceNode } from './source-node';

/**
 * Base class for all nodes in Grapevine.
 */
export abstract class VineNode<T> {
  private readonly nodeCache_: NodeCache<T>;

  constructor(
      private readonly initTime_: Time,
      private readonly id_: NodeId<T>) {
    this.nodeCache_ = new NodeCache();
  }

  protected abstract computeValue_(context: BaseDisposable, time: Time): T;

  getId(): NodeId<T> {
    return this.id_;
  }

  abstract getSources(): ImmutableSet<SourceNode<any>>;

  getValue(context: BaseDisposable, time: Time): T {
    const sourcesLatestTime = this.getSources()
        .reduceItem((latestTime: Time, source: SourceNode<any>) => {
          const sourceTime = source.nodeCache_.getLatestCachedTimeBefore(context, time);
          if (sourceTime && latestTime.before(sourceTime)) {
            return sourceTime;
          } else {
            return latestTime;
          }
        }, this.initTime_);

    const cachedValue = this.nodeCache_.getCachedValue(context, sourcesLatestTime);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const computedValue = this.computeValue_(context, sourcesLatestTime);
    this.nodeCache_.setCachedValue(computedValue, context, sourcesLatestTime);

    return computedValue;
  }

  protected setValue_(newValue: T, context: BaseDisposable, time: Time): void {
    this.nodeCache_.setCachedValue(newValue, context, time);
  }
}
