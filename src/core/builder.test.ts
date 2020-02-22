import { assert, createSpy, setup, should, test } from 'gs-testing';

import { Builder } from './builder';

test('@grapevine/core/builder', () => {
  let builder: Builder;

  setup(() => {
    builder = new Builder();
  });

  test('build', () => {
    should(`run the run handlers`, () => {
      const mockHandler1 = createSpy('Handler1');
      const mockHandler2 = createSpy('Handler2');
      builder.onRun(mockHandler1);
      builder.onRun(mockHandler2);

      const vine = builder.build('test');

      assert(mockHandler2).to.haveBeenCalledWith(vine);
    });
  });
});
