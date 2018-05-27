import { assert, should } from 'gs-testing/export/main';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { Time } from '../component/time';
import { NodeCache } from './node-cache';

describe('node.NodeCache', () => {
  let cache: NodeCache<number>;

  beforeEach(() => {
    cache = new NodeCache();
  });

  describe('getCachedValue', () => {
    should(`resolve the cached value if exist`, async () => {
      const value = 123;
      const context = new BaseDisposable();
      const time = Time.new();

      cache.setCachedValue(Promise.resolve(value), context, time);
      assert(await cache.getCachedValue(context, time)).to.be(value);
    });

    should(`resolve undefined if the value does not exist at the time`, async () => {
      const value = 123;
      const context = new BaseDisposable();
      const time = Time.new();

      cache.setCachedValue(Promise.resolve(value), context, time.increment());
      assert(await cache.getCachedValue(context, time)).toNot.beDefined();
    });

    should(`resolve undefined if the value does not exist at the context`, async () => {
      const value = 123;
      const context = new BaseDisposable();
      const time = Time.new();

      cache.setCachedValue(Promise.resolve(value), new BaseDisposable(), time);
      assert(await cache.getCachedValue(context, time)).toNot.beDefined();
    });

    should(`resolve undefined if the cache is empty`, async () => {
      assert(await cache.getCachedValue(new BaseDisposable(), Time.new())).toNot.beDefined();
    });
  });

  describe('getLatestCachedTimeBefore', () => {
    should(`return the latest cached time before the given time`, () => {
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();
      const time3 = time2.increment();

      const context = new BaseDisposable();

      cache.setCachedValue(Promise.resolve(0), context, time0);
      cache.setCachedValue(Promise.resolve(1), context, time1);
      cache.setCachedValue(Promise.resolve(3), context, time3);

      assert(cache.getLatestCachedTimeBefore(context, time2)).to.be(time1);
    });

    should(`return null if all the times are after the given time`, () => {
      const time0 = Time.new();
      const time1 = time0.increment();

      const context = new BaseDisposable();

      cache.setCachedValue(Promise.resolve(1), context, time1);

      assert(cache.getLatestCachedTimeBefore(context, time0)).to.beNull();
    });

    should(`return null if the context is wrong`, () => {
      const time0 = Time.new();
      const context = new BaseDisposable();

      cache.setCachedValue(Promise.resolve(1), context, time0);

      assert(cache.getLatestCachedTimeBefore(new BaseDisposable(), time0)).to.beNull();
    });

    should(`return null if the cache is empty`, () => {
      const time0 = Time.new();

      assert(cache.getLatestCachedTimeBefore(new BaseDisposable(), time0)).to.beNull();
    });
  });

  describe('setCachedValue', () => {
    should(`set the value correctly`, async () => {
      const time = Time.new();
      const value = 123;
      const context = new BaseDisposable();

      cache.setCachedValue(Promise.resolve(value), context, time);
      assert(await cache.getCachedValue(context, time)).to.be(value);
    });

    should(`clear the cache if the context is disposed`, async () => {
      const time = Time.new();
      const context = new BaseDisposable();

      cache.setCachedValue(Promise.resolve(123), context, time);
      context.dispose();
      assert(await cache.getCachedValue(context, time)).toNot.beDefined();
    });

    should(`do nothing if the time is before the latestTime`, async () => {
      const time0 = Time.new();
      const time1 = time0.increment();
      const value = 123;
      const context = new BaseDisposable();

      cache.setCachedValue(Promise.resolve(value), context, time1);
      cache.setCachedValue(Promise.resolve(456), context, time0);

      assert(await cache.getCachedValue(context, time0)).toNot.beDefined();
    });
  });
});
