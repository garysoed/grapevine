import { ImmutableSet } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { Errors } from 'gs-tools/export/error';
import { NodeId } from '../component/node-id';
import { Time } from '../component/time';
import { NodeCache } from './node-cache';
import { SourceNode } from './source-node';

/**
 * Base class for all nodes in Grapevine.
 */
export abstract class VineNode<T> {
  protected readonly nodeCache_: NodeCache<T>;

  constructor(
      private readonly initTime_: Time,
      private readonly id_: NodeId<T>) {
    this.nodeCache_ = new NodeCache();
  }

  protected abstract computeValue_(context: BaseDisposable, time: Time): Promise<T>;

  getId(): NodeId<T> {
    return this.id_;
  }

  abstract getSources(): ImmutableSet<SourceNode<any>>;

  async getValue(context: BaseDisposable, time: Time): Promise<T> {
    const sourcesLatestTime = this.getSources()
        .reduceItem((latestTime: Time, source: SourceNode<any>) => {
          const sourceTime = source.nodeCache_.getLatestCachedTimeBefore(context, time);
          if (sourceTime && latestTime.before(sourceTime)) {
            return sourceTime;
          } else {
            return latestTime;
          }
        }, this.initTime_);

    const cachedValue = await this.nodeCache_.getCachedValue(context, sourcesLatestTime);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const computedValuePromise = this.computeValue_(context, sourcesLatestTime);
    this.nodeCache_.setCachedValue(computedValuePromise, context, sourcesLatestTime);

    const computedValue = await computedValuePromise;
    const type = this.id_.getType();
    if (!type.check(computedValue)) {
      throw Errors.assert(`Return type of value ${this.id_}`).shouldBeA(type).butWas(computedValue);
    }

    return computedValuePromise;
  }
}
