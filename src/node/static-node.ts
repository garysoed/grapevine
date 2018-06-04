import { ImmutableSet } from 'gs-tools/export/collect';
import { Errors } from 'gs-tools/export/error';
import { Time } from '../component/time';
import { GLOBAL_CONTEXT } from './global-context';
import { StaticSourceNode } from './static-source-node';
import { VineNode } from './vine-node';

function getLatestCachedTimeBefore(
    source: StaticSourceNode<any>,
    time: Time): Time|null {
  return source.getLatestCachedTimeBefore(time);
}

/**
 * Base class for all nodes that are globally bound.
 */
export abstract class StaticNode<T> extends VineNode<T> {
  protected abstract computeValue_(time: Time): Promise<T>;

  getLatestCachedTimeBefore(time: Time): Time|null {
    return this.nodeCache_.getLatestCachedTimeBefore(GLOBAL_CONTEXT, time);
  }

  abstract getSources(): ImmutableSet<StaticSourceNode<any>>;

  async getValue(time: Time): Promise<T> {
    const sourcesLatestTime = this.getSources()
        .reduceItem((latestTime: Time, source: StaticSourceNode<any>) => {
          const sourceTime = getLatestCachedTimeBefore(source, time);
          if (sourceTime && latestTime.before(sourceTime)) {
            return sourceTime;
          } else {
            return latestTime;
          }
        }, this.initTime_);

    const cachedValue = await this.nodeCache_.getCachedValue(GLOBAL_CONTEXT, sourcesLatestTime);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const computedValuePromise = this.computeValue_(sourcesLatestTime);
    this.nodeCache_.setCachedValue(computedValuePromise, GLOBAL_CONTEXT, sourcesLatestTime);

    const computedValue = await computedValuePromise;
    const type = this.id_.getType();
    if (!type.check(computedValue)) {
      throw Errors.assert(`Return type of value ${this.id_}`).shouldBeA(type).butWas(computedValue);
    }

    return computedValuePromise;
  }
}
