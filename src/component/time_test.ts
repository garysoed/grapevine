import 'jasmine';

import { assert, should } from 'gs-testing/export/main';
import { Time } from './time';

describe('component.Time', () => {
  describe('beforeOrEqualTo', () => {
    should(`return true if the first time is before the second one`, () => {
      const time1 = Time.new();
      const time2 = Time.new().increment();

      assert(time1.beforeOrEqualTo(time2)).to.beTrue();
    });

    should(`return true if the two times are equal`, () => {
      const time = Time.new();

      assert(time.beforeOrEqualTo(time)).to.beTrue();
    });

    should(`return false if the first time is after the second one`, () => {
      const time1 = Time.new();
      const time2 = Time.new().increment();

      assert(time2.beforeOrEqualTo(time1)).to.beFalse();
    });
  });
});
