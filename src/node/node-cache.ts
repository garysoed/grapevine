import { BaseDisposable, DisposableFunction } from 'gs-tools/export/dispose';
import { Time } from '../component/time';

/**
 * Cache mechanism for nodes.
 */
export class NodeCache<T> {
  // Map of context to Time to the value at that time.
  private readonly cache_: Map<BaseDisposable, Map<Time, Promise<T>>> = new Map();
  private latestTime_: Time|null = null;

  private getCacheByContext_(context: BaseDisposable): Map<Time, Promise<T>> {
    const cache = this.cache_.get(context);
    if (cache) {
      return cache;
    }

    const newCache = new Map<Time, Promise<T>>();
    this.cache_.set(context, newCache);
    context.addDisposable(DisposableFunction.of(() => {
      this.cache_.delete(context);
    }));

    return newCache;
  }

  async getCachedValue(context: BaseDisposable, time: Time): Promise<T | undefined> {
    const timeCache = this.cache_.get(context);
    if (!timeCache) {
      return undefined;
    }

    return timeCache.get(time);
  }

  getLatestCachedTimeBefore(context: BaseDisposable, thresholdTime: Time): Time | null {
    const valueMap = this.cache_.get(context);
    if (!valueMap) {
      return null;
    }

    let latestCachedTime = null;
    for (const [time] of valueMap) {
      if (time.beforeOrEqualTo(thresholdTime) &&
          (latestCachedTime === null || latestCachedTime.before(time))) {
        latestCachedTime = time;
      }
    }

    return latestCachedTime;
  }

  setCachedValue(newValue: Promise<T>, context: BaseDisposable, time: Time): void {
    if (this.latestTime_ && time.beforeOrEqualTo(this.latestTime_)) {
      return;
    }

    const timeMap = this.getCacheByContext_(context);
    timeMap.set(time, newValue);
    this.cache_.set(context, timeMap);
    this.latestTime_ = time;
  }
}
