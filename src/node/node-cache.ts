import { BaseDisposable, DisposableFunction } from 'gs-tools/export/dispose';
import { Time } from '../component/time';
import { ContextedNodeCache } from './contexted-node-cache';

/**
 * Cache mechanism for nodes.
 */
export class NodeCache<T> {
  // Map of context to Time to the value at that time.
  private readonly cache_: Map<BaseDisposable, ContextedNodeCache<T>> = new Map();

  private getCacheByContext_(context: BaseDisposable): ContextedNodeCache<T> {
    const cache = this.cache_.get(context);
    if (cache) {
      return cache;
    }

    const newCache = new ContextedNodeCache<T>();
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

    return timeCache.getCachedValue(time);
  }

  getLatestCachedTimeBefore(context: BaseDisposable, thresholdTime: Time): Time | null {
    const contextedNodeCache = this.cache_.get(context);
    if (!contextedNodeCache) {
      return null;
    }

    return contextedNodeCache.getLatestCachedTimeBefore(thresholdTime);
  }

  setCachedValue(newValue: Promise<T>, context: BaseDisposable, time: Time): void {
    const contextedNodeCache = this.getCacheByContext_(context);
    contextedNodeCache.setCachedValue(newValue, time);
    this.cache_.set(context, contextedNodeCache);
  }
}
