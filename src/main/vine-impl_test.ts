import 'jasmine';

import { assert, match, retryUntil, should } from 'gs-testing/export/main';
import { MockTime } from 'gs-testing/export/mock';
import { createSpy } from 'gs-testing/export/spy';
import { ImmutableList, ImmutableMap } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { SourceId } from '../component/source-id';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { Time } from '../component/time';
import { InstanceSourceNode } from '../node/instance-source-node';
import { InstanceStreamNode } from '../node/instance-stream-node';
import { SourceNode } from '../node/source-node';
import { StaticSourceNode } from '../node/static-source-node';
import { StaticStreamNode } from '../node/static-stream-node';
import { VineImpl } from './vine-impl';

describe('main.VineImpl', () => {
  let mockTime: MockTime;

  beforeEach(() => {
    mockTime = new MockTime();
  });

  describe('listen', () => {
    should(`call the handler correctly for static source IDs`, async () => {
      const time = Time.new();
      const id1 = staticSourceId('id1', NumberType);
      const id2 = staticSourceId('id2', StringType);
      const initValue1 = 1;
      const initValue2 = 'abc';
      const newValue1 = 2;
      const newValue2 = 'def';
      const newerValue = 4;
      const sourceNode1 = new StaticSourceNode(id1, time, () => initValue1);
      const sourceNode2 = new StaticSourceNode(id2, time, () => initValue2);

      const vine = new VineImpl(
          time,
          ImmutableMap.of<SourceId<any>, SourceNode<any>>([[id1, sourceNode1], [id2, sourceNode2]]),
          ImmutableMap.of(),
          mockTime.createWindow());

      const mockHandler = createSpy('Handler');
      const unlistenFn = vine.listen(mockHandler, id1, id2);

      mockTime.at(1, () => vine.setValue(id1, newValue1));
      mockTime.at(3, () => vine.setValue(id2, newValue2));
      mockTime.at(5, () => {
        unlistenFn();
        vine.setValue(id1, newerValue);
      });

      mockTime.at(
          0,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(initValue1, initValue2)));
      mockTime.at(
          2,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(newValue1, initValue2)));
      mockTime.at(
          4,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(newValue1, newValue2)));
      mockTime.at(
          6,
          async () => retryUntil(() => mockHandler)
              .toNot.equal(match.anySpyThat().haveBeenCalledWith(newerValue)));
      await mockTime.run();
    });

    should(`call the handler correctly for instance source IDs`, async () => {
      const time = Time.new();
      const id1 = instanceSourceId('id1', NumberType);
      const id2 = staticSourceId('id2', StringType);
      const initValue1 = 1;
      const initValue2 = 'abc';
      const newValue1 = 2;
      const newValue2 = 'def';
      const newerValue = 4;
      const sourceNode1 = new InstanceSourceNode(id1, time, () => initValue1);
      const sourceNode2 = new StaticSourceNode(id2, time, () => initValue2);
      const context = new BaseDisposable();

      const vine = new VineImpl(
          time,
          ImmutableMap.of<SourceId<any>, SourceNode<any>>([[id1, sourceNode1], [id2, sourceNode2]]),
          ImmutableMap.of(),
          mockTime.createWindow());

      const mockHandler = createSpy('Handler');
      const unlistenFn = vine.listen(mockHandler, context, id1, id2);

      mockTime.at(1, () => vine.setValue(id1, newValue1, context));
      mockTime.at(3, () => vine.setValue(id2, newValue2));
      mockTime.at(5, () => {
        unlistenFn();
        vine.setValue(id1, newerValue, context);
      });

    mockTime.at(
        0,
        async () => retryUntil(() => mockHandler)
            .to.equal(match.anySpyThat().haveBeenCalledWith(initValue1, initValue2)));
    mockTime.at(
        2,
        async () => retryUntil(() => mockHandler)
            .to.equal(match.anySpyThat().haveBeenCalledWith(newValue1, initValue2)));
    mockTime.at(
        4,
        async () => retryUntil(() => mockHandler)
            .to.equal(match.anySpyThat().haveBeenCalledWith(newValue1, newValue2)));
    mockTime.at(
        6,
        async () => retryUntil(() => mockHandler)
            .toNot.equal(match.anySpyThat().haveBeenCalledWith(newerValue)));
      await mockTime.run();
    });

    should(`call the handler correctly for static stream IDs`, async () => {
      const time = Time.new();
      const sourceId = staticSourceId('sourceId', NumberType);
      const sourceNode = new StaticSourceNode(sourceId, time, () => 1);

      const id = staticStreamId('streamId', NumberType);
      const streamNode = new StaticStreamNode(
          id,
          time,
          v => v * v,
          ImmutableList.of([sourceNode]));

      const mockHandler = createSpy('Handler');

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[sourceId, sourceNode]]),
          ImmutableMap.of([[id, streamNode]]),
          mockTime.createWindow());

      const unlistenFn = vine.listen(mockHandler, id);
      mockTime.at(1, () => vine.setValue(sourceId, 2));
      mockTime.at(3, () => {
        unlistenFn();
        vine.setValue(sourceId, 4);
      });

      mockTime.at(
          0,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(1)));
      mockTime.at(
          2,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(4)));
      mockTime.at(
          4,
          async () => retryUntil(() => mockHandler)
              .toNot.equal(match.anySpyThat().haveBeenCalledWith(16)));
      await mockTime.run();
    });

    should(`call the handler correctly for instance stream IDs`, async () => {
      const time = Time.new();
      const sourceId = instanceSourceId('sourceId', NumberType);
      const sourceNode = new InstanceSourceNode(sourceId, time, () => 1);

      const id = instanceStreamId('streamId', NumberType);
      const streamNode = new InstanceStreamNode(
          id,
          time,
          v => v * v,
          ImmutableList.of([sourceNode]));
      const context = new BaseDisposable();

      const mockHandler = createSpy('Handler');

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[sourceId, sourceNode]]),
          ImmutableMap.of([[id, streamNode]]),
          mockTime.createWindow());

      const unlistenFn = vine.listen(mockHandler, context, id);
      mockTime.at(1, () => vine.setValue(sourceId, 2, context));
      mockTime.at(3, () => {
        unlistenFn();
        vine.setValue(sourceId, 4, context);
      });

      mockTime.at(
          0,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(1)));
      mockTime.at(
          2,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(4)));
      mockTime.at(
          4,
          async () => retryUntil(() => mockHandler)
              .toNot.equal(match.anySpyThat().haveBeenCalledWith(16)));
      await mockTime.run();
    });

    should(`throw error if the node cannot be found`, () => {
      const nodeId = staticSourceId('sourceId', NumberType);
      const vine = new VineImpl(
          Time.new(),
          ImmutableMap.of(),
          ImmutableMap.of(),
          mockTime.createWindow());

      assert(() => {
        vine.listen(() => undefined, nodeId);
      }).to.throwErrorWithMessage(/cannot be found/);
    });
  });

  describe('setValue', () => {
    should(`set the value correctly for static source nodes`, async () => {
      const time = Time.new();
      const id = staticSourceId('id', NumberType);
      const value = 2;
      const sourceNode = new StaticSourceNode(id, time, () => 1);

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[id, sourceNode]]),
          ImmutableMap.of(),
          mockTime.createWindow());

      const mockHandler = createSpy('Handler');
      vine.listen(mockHandler, id);

      mockTime.at(1, () => vine.setValue(id, value));

      mockTime.at(
          2,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(value)));
      await mockTime.run();
    });

    should(`not set the value for static source nodes if they are the same`, async () => {
      const time = Time.new();
      const id = staticSourceId('id', NumberType);
      const value = 2;
      const sourceNode = new StaticSourceNode(id, time, () => 1);
      const mockHandler = createSpy('Handler');

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[id, sourceNode]]),
          ImmutableMap.of(),
          mockTime.createWindow());

      mockTime.at(1, () => vine.setValue(id, value));
      mockTime.at(2, () => {
        vine.listen(mockHandler, id);
        vine.setValue(id, value);
      });

      mockTime.at(3, () => {
        assert(mockHandler).toNot.haveBeenCalled();
      });
      await mockTime.run();
    });

    should(`set the value correctly for instance source nodes`, async () => {
      const time = Time.new();
      const id = instanceSourceId('id', NumberType);
      const value = 2;
      const sourceNode = new InstanceSourceNode(id, time, () => 1);
      const context = new BaseDisposable();

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[id, sourceNode]]),
          ImmutableMap.of(),
          mockTime.createWindow());

      const mockHandler = createSpy('Handler');
      vine.listen(mockHandler, context, id);

      mockTime.at(1, () => vine.setValue(id, value, context));

      mockTime.at(
          2,
          async () => retryUntil(() => mockHandler)
              .to.equal(match.anySpyThat().haveBeenCalledWith(value)));
      await mockTime.run();
    });

    should(`not set the value for instance source nodes if they are the same`, async () => {
      const time = Time.new();
      const id = instanceSourceId('id', NumberType);
      const value = 2;
      const sourceNode = new InstanceSourceNode(id, time, () => 1);
      const context = new BaseDisposable();
      const mockHandler = createSpy('Handler');

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[id, sourceNode]]),
          ImmutableMap.of(),
          mockTime.createWindow());

      mockTime.at(1, () => vine.setValue(id, value, context));
      mockTime.at(2, () => {
        vine.listen(mockHandler, context, id);
        vine.setValue(id, value, context);
      });

      mockTime.at(3, () => {
        assert(mockHandler).toNot.haveBeenCalled();
      });
      await mockTime.run();
    });

    should(`throw error if the node cannot be found`, () => {
      const nodeId = staticSourceId('sourceId', NumberType);
      const vine = new VineImpl(
          Time.new(),
          ImmutableMap.of(),
          ImmutableMap.of(),
          mockTime.createWindow());

      assert(() => {
        vine.setValue(nodeId, 12);
      }).to.throwErrorWithMessage(/cannot be found/);
    });
  });
});
