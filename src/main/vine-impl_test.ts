import 'jasmine';

import { assert, should } from 'gs-testing/export/main';
import { createSpy, resetCalls } from 'gs-testing/export/spy';
import { ImmutableList, ImmutableMap } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { SourceId } from '../component/source-id';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { InstanceSourceNode } from '../node/instance-source-node';
import { InstanceStreamNode } from '../node/instance-stream-node';
import { SourceNode } from '../node/source-node';
import { StaticSourceNode } from '../node/static-source-node';
import { StaticStreamNode } from '../node/static-stream-node';
import { VineImpl } from './vine-impl';

describe('main.VineImpl', () => {
  describe('listen', () => {
    should(`call the handler correctly for static source IDs`, () => {
      const id1 = staticSourceId('id1', NumberType);
      const id2 = staticSourceId('id2', StringType);
      const initValue1 = 1;
      const initValue2 = 'abc';
      const newValue1 = 2;
      const newValue2 = 'def';
      const newerValue = 4;
      const sourceSubject1 = new StaticSourceNode(() => initValue1);
      const sourceSubject2 = new StaticSourceNode(() => initValue2);

      const vine = new VineImpl(
          ImmutableMap.of<SourceId<any>, SourceNode<any>>([
            [id1, sourceSubject1],
            [id2, sourceSubject2],
          ]),
          ImmutableMap.of(),
      );

      const mockHandler = createSpy('Handler');
      const unlistenFn = vine.listen(mockHandler, id1, id2);

      assert(mockHandler).to.haveBeenCalledWith(initValue1, initValue2);

      vine.setValue(id1, newValue1);
      assert(mockHandler).to.haveBeenCalledWith(newValue1, initValue2);

      vine.setValue(id2, newValue2);
      assert(mockHandler).to.haveBeenCalledWith(newValue1, newValue2);

      unlistenFn();
      resetCalls(mockHandler);
      vine.setValue(id1, newerValue);
      assert(mockHandler).toNot.haveBeenCalled();
    });

    should(`call the handler correctly for instance source IDs`, () => {
      const id1 = instanceSourceId('id1', NumberType);
      const id2 = staticSourceId('id2', StringType);
      const initValue1 = 1;
      const initValue2 = 'abc';
      const newValue1 = 2;
      const newValue2 = 'def';
      const newerValue = 4;
      const sourceSubject1 = new InstanceSourceNode(() => initValue1);
      const sourceSubject2 = new StaticSourceNode(() => initValue2);
      const context = new BaseDisposable();

      const vine = new VineImpl(
          ImmutableMap.of<SourceId<any>, SourceNode<any>>([
            [id1, sourceSubject1],
            [id2, sourceSubject2],
          ]),
          ImmutableMap.of(),
      );

      const mockHandler = createSpy('Handler');
      const unlistenFn = vine.listen(mockHandler, context, id1, id2);

      assert(mockHandler).to.haveBeenCalledWith(initValue1, initValue2);

      vine.setValue(id1, newValue1, context);
      assert(mockHandler).to.haveBeenCalledWith(newValue1, initValue2);

      vine.setValue(id2, newValue2);
      assert(mockHandler).to.haveBeenCalledWith(newValue1, newValue2);

      unlistenFn();
      resetCalls(mockHandler);
      vine.setValue(id1, newerValue, context);
      assert(mockHandler).toNot.haveBeenCalled();
    });

    should(`call the handler correctly for static stream IDs`, () => {
      const sourceId = staticSourceId('sourceId', NumberType);
      const sourceSubject = new StaticSourceNode(() => 1);

      const id = staticStreamId('streamId', NumberType);
      const streamSubject = new StaticStreamNode(
          ImmutableList.of([sourceSubject]),
          v => v * v,
      );

      const mockHandler = createSpy('Handler');

      const vine = new VineImpl(
          ImmutableMap.of([[sourceId, sourceSubject]]),
          ImmutableMap.of([[id, streamSubject]]),
      );

      const unlistenFn = vine.listen(mockHandler, id);
      assert(mockHandler).to.haveBeenCalledWith(1);

      vine.setValue(sourceId, 2);
      assert(mockHandler).to.haveBeenCalledWith(4);

      unlistenFn();
      resetCalls(mockHandler);
      vine.setValue(sourceId, 4);
      assert(mockHandler).toNot.haveBeenCalled();
    });

    should(`call the handler correctly for instance stream IDs`, () => {
      const sourceId = instanceSourceId('sourceId', NumberType);
      const sourceSubject = new InstanceSourceNode(() => 1);

      const id = instanceStreamId('streamId', NumberType);
      const streamSubject = new InstanceStreamNode(
          ImmutableList.of([sourceSubject]),
          v => v * v,
          );
      const context = new BaseDisposable();

      const mockHandler = createSpy('Handler');

      const vine = new VineImpl(
          ImmutableMap.of([[sourceId, sourceSubject]]),
          ImmutableMap.of([[id, streamSubject]]),
      );

      const unlistenFn = vine.listen(mockHandler, context, id);
      assert(mockHandler).to.haveBeenCalledWith(1);

      vine.setValue(sourceId, 2, context);
      assert(mockHandler).to.haveBeenCalledWith(4);

      unlistenFn();
      resetCalls(mockHandler);
      vine.setValue(sourceId, 4, context);
      assert(mockHandler).toNot.haveBeenCalled();
    });

    should(`throw error if the node cannot be found`, () => {
      const nodeId = staticSourceId('sourceId', NumberType);
      const vine = new VineImpl(
          ImmutableMap.of(),
          ImmutableMap.of(),
      );

      assert(() => {
        vine.listen(() => undefined, nodeId);
      }).to.throwErrorWithMessage(/cannot be found/);
    });
  });

  describe('setValue', () => {
    should(`set the value correctly for static source nodes`, () => {
      const id = staticSourceId('id', NumberType);
      const value = 2;
      const sourceSubject = new StaticSourceNode(() => 1);

      const vine = new VineImpl(
          ImmutableMap.of([[id, sourceSubject]]),
          ImmutableMap.of(),
      );

      const mockHandler = createSpy('Handler');
      vine.listen(mockHandler, id);

      vine.setValue(id, value);
      assert(mockHandler).to.haveBeenCalledWith(value);
    });

    should(`not set the value for static source nodes if they are the same`, () => {
      const id = staticSourceId('id', NumberType);
      const value = 2;
      const sourceSubject = new StaticSourceNode(() => 1);
      const mockHandler = createSpy('Handler');

      const vine = new VineImpl(
          ImmutableMap.of([[id, sourceSubject]]),
          ImmutableMap.of(),
      );

      vine.setValue(id, value);
      vine.listen(mockHandler, id);
      resetCalls(mockHandler);
      vine.setValue(id, value);
      assert(mockHandler).toNot.haveBeenCalled();
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

      const mockHandler = createSpy('Handler');
      vine.listen(mockHandler, context, id);

      vine.setValue(id, value, context);
      assert(mockHandler).to.haveBeenCalledWith(value);
    });

    should(`not set the value for instance source nodes if they are the same`, () => {
      const id = instanceSourceId('id', NumberType);
      const value = 2;
      const sourceSubject = new InstanceSourceNode(() => 1);
      const context = new BaseDisposable();
      const mockHandler = createSpy('Handler');

      const vine = new VineImpl(
          ImmutableMap.of([[id, sourceSubject]]),
          ImmutableMap.of(),
      );

      vine.setValue(id, value, context);
      vine.listen(mockHandler, context, id);
      resetCalls(mockHandler);
      vine.setValue(id, value, context);
      assert(mockHandler).toNot.haveBeenCalled();
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
