import { Time } from '../component/time';

/**
 * Cache mechanism for nodes.
 */
export class ContextedNodeCache<T> {
  // Map of context to Time to the value at that time.
  private readonly cache_: Map<Time, Promise<T>> = new Map();
  private latestTime_: Time|null = null;

  async getCachedValue(time: Time): Promise<T | undefined> {
    return this.cache_.get(time);
  }

  getLatestCachedTimeBefore(thresholdTime: Time): Time | null {
    let latestCachedTime = null;
    for (const [time] of this.cache_) {
      if (time.beforeOrEqualTo(thresholdTime) &&
          (latestCachedTime === null || latestCachedTime.before(time))) {
        latestCachedTime = time;
      }
    }

    return latestCachedTime;
  }

  setCachedValue(newValue: Promise<T>, time: Time): void {
    if (this.latestTime_ && time.beforeOrEqualTo(this.latestTime_)) {
      return;
    }

    this.cache_.set(time, newValue);
    this.latestTime_ = time;
  }
}
