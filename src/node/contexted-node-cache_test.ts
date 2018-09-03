import { assert, should } from 'gs-testing/export/main';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { Time } from '../component/time';
import { ContextedNodeCache } from './contexted-node-cache';

describe('node.ContextedNodeCache', () => {
  let cache: ContextedNodeCache<number>;

  beforeEach(() => {
    cache = new ContextedNodeCache();
  });

  describe('getCachedValue', () => {
    should(`resolve the cached value if exist`, async () => {
      const value = 123;
      const time = Time.new();

      cache.setCachedValue(Promise.resolve(value), time);
      assert(await cache.getCachedValue(time)).to.equal(value);
    });

    should(`resolve undefined if the value does not exist at the time`, async () => {
      const value = 123;
      const time = Time.new();

      cache.setCachedValue(Promise.resolve(value), time.increment());
      assert(await cache.getCachedValue(time)).toNot.beDefined();
    });

    should(`resolve undefined if the cache is empty`, async () => {
      assert(await cache.getCachedValue(Time.new())).toNot.beDefined();
    });
  });

  describe('getLatestCachedTimeBefore', () => {
    should(`return the latest cached time before the given time`, () => {
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();
      const time3 = time2.increment();


      cache.setCachedValue(Promise.resolve(0), time0);
      cache.setCachedValue(Promise.resolve(1), time1);
      cache.setCachedValue(Promise.resolve(3), time3);

      assert(cache.getLatestCachedTimeBefore(time2)).to.equal(time1);
    });

    should(`return null if all the times are after the given time`, () => {
      const time0 = Time.new();
      const time1 = time0.increment();

      const context = new BaseDisposable();

      cache.setCachedValue(Promise.resolve(1), time1);

      assert(cache.getLatestCachedTimeBefore(time0)).to.beNull();
    });

    should(`return null if the cache is empty`, () => {
      const time0 = Time.new();

      assert(cache.getLatestCachedTimeBefore(time0)).to.beNull();
    });
  });

  describe('setCachedValue', () => {
    should(`set the value correctly`, async () => {
      const time = Time.new();
      const value = 123;

      cache.setCachedValue(Promise.resolve(value), time);
      assert(await cache.getCachedValue(time)).to.equal(value);
    });

    should(`do nothing if the time is before the latestTime`, async () => {
      const time0 = Time.new();
      const time1 = time0.increment();
      const value = 123;

      cache.setCachedValue(Promise.resolve(value), time1);
      cache.setCachedValue(Promise.resolve(456), time0);

      assert(await cache.getCachedValue(time0)).toNot.beDefined();
    });
  });
});
