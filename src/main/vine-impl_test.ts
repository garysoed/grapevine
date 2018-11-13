import 'jasmine';

import { assert, should } from 'gs-testing/export/main';
import { ImmutableMap } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType } from 'gs-types/export';
import { BehaviorSubject } from 'rxjs';
import { instanceSourceId } from '../component/instance-source-id';
import { staticSourceId } from '../component/static-source-id';
import { InstanceSourceNode } from '../node/instance-source-node';
import { StaticSourceNode } from '../node/static-source-node';
import { VineImpl } from './vine-impl';

describe('main.VineImpl', () => {
  describe('setValue', () => {
    should(`set the value correctly for static source nodes`, () => {
      const id = staticSourceId('id', NumberType);
      const value = 2;
      const sourceSubject = new StaticSourceNode(() => 1);

      const vine = new VineImpl(
          ImmutableMap.of([[id, sourceSubject]]),
          ImmutableMap.of(),
      );

      const subject = new BehaviorSubject<number|null>(null);
      vine.getObservable(id).subscribe(subject);

      vine.setValue(id, value);
      assert(subject.getValue()).to.equal(value);
    });

    should(`set the value correctly for instance source nodes`, () => {
      const id = instanceSourceId('id', NumberType);
      const value = 2;
      const sourceSubject = new InstanceSourceNode(() => 1);
      const context = new BaseDisposable();

      const vine = new VineImpl(
          ImmutableMap.of([[id, sourceSubject]]),
          ImmutableMap.of(),
      );

      const subject = new BehaviorSubject<number|null>(null);
      vine.getObservable(id, context).subscribe(subject);

      vine.setValue(id, value, context);
      assert(subject.getValue()).to.equal(value);
    });

    should(`throw error if the node cannot be found`, () => {
      const nodeId = staticSourceId('sourceId', NumberType);
      const vine = new VineImpl(
          ImmutableMap.of(),
          ImmutableMap.of(),
      );

      assert(() => {
        vine.setValue(nodeId, 12);
      }).to.throwErrorWithMessage(/cannot be found/);
    });
  });
});
