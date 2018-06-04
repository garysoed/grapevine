import { BaseDisposable } from 'gs-tools/export/dispose';
import { Errors } from 'gs-tools/export/error';
import { Time } from '../component/time';
import { SourceNode } from './source-node';
import { StaticSourceNode } from './static-source-node';
import { VineNode } from './vine-node';

function getLatestCachedTimeBefore(
    source: SourceNode<any>,
    context: BaseDisposable,
    time: Time): Time|null {
  if (source instanceof StaticSourceNode) {
    return source.getLatestCachedTimeBefore(time);
  } else {
    return source.getLatestCachedTimeBefore(context, time);
  }
}

/**
 * Base class of all nodes that are bound to class instances.
 */
export abstract class InstanceNode<T> extends VineNode<T> {
  protected abstract computeValue_(context: BaseDisposable, time: Time): Promise<T>;

  getLatestCachedTimeBefore(context: BaseDisposable, time: Time): Time|null {
    return this.nodeCache_.getLatestCachedTimeBefore(context, time);
  }

  async getValue(context: BaseDisposable, time: Time): Promise<T> {
    const sourcesLatestTime = this.getSources()
        .reduceItem((latestTime: Time, source: SourceNode<any>) => {
          const sourceTime = getLatestCachedTimeBefore(source, context, time);
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
