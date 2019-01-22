import 'jasmine';

import { assert, setup, should, teardown, test } from 'gs-testing/export/main';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType } from 'gs-types/export';
import { BehaviorSubject } from 'rxjs';
import { instanceSourceId } from '../component/instance-source-id';
import { staticSourceId } from '../component/static-source-id';
import { clearApps, getOrRegisterApp, VineApp } from './vine';

test('main.VineImpl', () => {
  let app: VineApp;

  setup(() => {
    app = getOrRegisterApp('test');
  });

  teardown(() => {
    clearApps();
  });

  test('setValue', () => {
    should(`set the value correctly for static source nodes`, () => {
      const id = staticSourceId('id', NumberType);
      const value = 2;
      app.builder.source(id, 1);

      const vine = app.builder.run([]);
      const subject = new BehaviorSubject<number|null>(null);
      vine.getObservable(id).subscribe(subject);

      vine.setValue(id, value);
      assert(subject.getValue()).to.equal(value);
    });

    should(`set the value correctly for instance source nodes`, () => {
      const id = instanceSourceId('id', NumberType);
      const value = 2;
      const context = new BaseDisposable();
      app.builder.source(id, 1);

      const vine = app.builder.run([]);

      const subject = new BehaviorSubject<number|null>(null);
      vine.getObservable(id, context).subscribe(subject);

      vine.setValue(id, value, context);
      assert(subject.getValue()).to.equal(value);
    });

    should(`throw error if the node cannot be found`, () => {
      const nodeId = staticSourceId('sourceId', NumberType);
      const vine = app.builder.run([]);

      assert(() => {
        vine.setValue(nodeId, 12);
      }).to.throwErrorWithMessage(/cannot be found/);
    });
  });
});
