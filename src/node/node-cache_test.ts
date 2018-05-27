import { assert } from 'gs-testing/export/main';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { Time } from '../component/time';
import { NodeCache } from './node-cache';

describe('node.NodeCache', () => {
  let cache: NodeCache<number>;

  beforeEach(() => {
    cache = new NodeCache();
  });

  describe('getCachedValue', () => {
    it(`should return the cached value if exist`, () => {
      const value = 123;
      const context = new BaseDisposable();
      const time = Time.new();

      cache.setCachedValue(value, context, time);
      assert(cache.getCachedValue(context, time)).to.be(value);
    });

    it(`should return undefined if the value does not exist at the time`, () => {
      const value = 123;
      const context = new BaseDisposable();
      const time = Time.new();

      cache.setCachedValue(value, context, time.increment());
      assert(cache.getCachedValue(context, time)).toNot.beDefined();
    });

    it(`should return undefined if the value does not exist at the context`, () => {
      const value = 123;
      const context = new BaseDisposable();
      const time = Time.new();

      cache.setCachedValue(value, new BaseDisposable(), time);
      assert(cache.getCachedValue(context, time)).toNot.beDefined();
    });

    it(`should return undefined if the cache is empty`, () => {
      assert(cache.getCachedValue(new BaseDisposable(), Time.new())).toNot.beDefined();
    });
  });

  describe('getLatestCachedTimeBefore', () => {
    it(`should return the latest cached time before the given time`, () => {
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();
      const time3 = time2.increment();

      const context = new BaseDisposable();

      cache.setCachedValue(0, context, time0);
      cache.setCachedValue(1, context, time1);
      cache.setCachedValue(3, context, time3);

      assert(cache.getLatestCachedTimeBefore(context, time2)).to.be(time1);
    });

    it(`should return null if all the times are after the given time`, () => {
      const time0 = Time.new();
      const time1 = time0.increment();

      const context = new BaseDisposable();

      cache.setCachedValue(1, context, time1);

      assert(cache.getLatestCachedTimeBefore(context, time0)).to.beNull();
    });

    it(`should return null if the context is wrong`, () => {
      const time0 = Time.new();
      const context = new BaseDisposable();

      cache.setCachedValue(1, context, time0);

      assert(cache.getLatestCachedTimeBefore(new BaseDisposable(), time0)).to.beNull();
    });

    it(`should return null if the cache is empty`, () => {
      const time0 = Time.new();

      assert(cache.getLatestCachedTimeBefore(new BaseDisposable(), time0)).to.beNull();
    });
  });

  describe('setCachedValue', () => {
    it(`should set the value correctly`, () => {
      const time = Time.new();
      const value = 123;
      const context = new BaseDisposable();

      cache.setCachedValue(value, context, time);
      assert(cache.getCachedValue(context, time)).to.be(value);
    });

    it(`should clear the cache if the context is disposed`, () => {
      const time = Time.new();
      const context = new BaseDisposable();

      cache.setCachedValue(123, context, time);
      context.dispose();
      assert(cache.getCachedValue(context, time)).toNot.beDefined();
    });

    it(`should do nothing if the time is before the latestTime`, () => {
      const time0 = Time.new();
      const time1 = time0.increment();
      const value = 123;
      const context = new BaseDisposable();

      cache.setCachedValue(value, context, time1);
      cache.setCachedValue(456, context, time0);

      assert(cache.getCachedValue(context, time0)).toNot.beDefined();
    });
  });
});
