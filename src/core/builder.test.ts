import {assert, createSpy, should, test} from 'gs-testing';

import {Builder} from './builder';

test('@grapevine/core/builder', init => {
  const _ = init(() => {
    const builder = new Builder();
    return {builder};
  });

  test('build', () => {
    should('run the run handlers', () => {
      const mockHandler1 = createSpy('Handler1');
      const mockHandler2 = createSpy('Handler2');
      _.builder.onRun(mockHandler1);
      _.builder.onRun(mockHandler2);

      const vine = _.builder.build('test');

      assert(mockHandler2).to.haveBeenCalledWith(vine);
    });
  });
});
