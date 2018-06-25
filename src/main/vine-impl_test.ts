import 'jasmine';

import { assert, should, wait } from 'gs-testing/export/main';
import { MockTime } from 'gs-testing/export/mock';
import { ImmutableList, ImmutableMap } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { Time } from '../component/time';
import { InstanceSourceNode } from '../node/instance-source-node';
import { InstanceStreamNode } from '../node/instance-stream-node';
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
      const id = staticSourceId('id', NumberType);
      const initValue = 1;
      const newValue = 2;
      const newerValue = 4;
      const sourceNode = new StaticSourceNode(id, time, () => initValue);

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[id, sourceNode]]),
          ImmutableMap.of(),
          mockTime.createWindow());

      const mockHandler = jasmine.createSpy('Handler');
      const unlistenFn = vine.listen(id, mockHandler);

      mockTime.at(1, () => vine.setValue(id, newValue));
      mockTime.at(3, () => {
        unlistenFn();
        vine.setValue(id, newerValue);
      });

      mockTime.at(0, async () => wait(mockHandler).to.haveBeenCalledWith(initValue));
      mockTime.at(2, async () => wait(mockHandler).to.haveBeenCalledWith(newValue));
      mockTime.at(4, async () => wait(mockHandler).toNot.haveBeenCalledWith(newerValue));
      await mockTime.run();
    });

    should(`call the handler correctly for instance source IDs`, async () => {
      const time = Time.new();
      const id = instanceSourceId('id', NumberType);
      const initValue = 1;
      const newValue = 2;
      const newerValue = 4;
      const sourceNode = new InstanceSourceNode(id, time, () => initValue);
      const context = new BaseDisposable();

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[id, sourceNode]]),
          ImmutableMap.of(),
          mockTime.createWindow());

      const mockHandler = jasmine.createSpy('Handler');
      const unlistenFn = vine.listen(id, mockHandler, context);

      mockTime.at(1, () => vine.setValue(id, newValue, context));
      mockTime.at(3, () => {
        unlistenFn();
        vine.setValue(id, newerValue, context);
      });

      mockTime.at(0, async () => wait(mockHandler).to.haveBeenCalledWith(initValue));
      mockTime.at(2, async () => wait(mockHandler).to.haveBeenCalledWith(newValue));
      mockTime.at(4, async () => wait(mockHandler).toNot.haveBeenCalledWith(newerValue));
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

      const mockHandler = jasmine.createSpy('Handler');

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[sourceId, sourceNode]]),
          ImmutableMap.of([[id, streamNode]]),
          mockTime.createWindow());

      const unlistenFn = vine.listen(id, mockHandler);
      mockTime.at(1, () => vine.setValue(sourceId, 2));
      mockTime.at(3, () => {
        unlistenFn();
        vine.setValue(sourceId, 4);
      });

      mockTime.at(0, async () => wait(mockHandler).to.haveBeenCalledWith(1));
      mockTime.at(2, async () => wait(mockHandler).to.haveBeenCalledWith(4));
      mockTime.at(4, async () => wait(mockHandler).toNot.haveBeenCalledWith(16));
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

      const mockHandler = jasmine.createSpy('Handler');

      const vine = new VineImpl(
          time,
          ImmutableMap.of([[sourceId, sourceNode]]),
          ImmutableMap.of([[id, streamNode]]),
          mockTime.createWindow());

      const unlistenFn = vine.listen(id, mockHandler, context);
      mockTime.at(1, () => vine.setValue(sourceId, 2, context));
      mockTime.at(3, () => {
        unlistenFn();
        vine.setValue(sourceId, 4, context);
      });

      mockTime.at(0, async () => wait(mockHandler).to.haveBeenCalledWith(1));
      mockTime.at(2, async () => wait(mockHandler).to.haveBeenCalledWith(4));
      mockTime.at(4, async () => wait(mockHandler).toNot.haveBeenCalledWith(16));
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
        vine.listen(nodeId, () => undefined);
      }).to.throwError(/cannot be found/);
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

      const mockHandler = jasmine.createSpy('Handler');
      vine.listen(id, mockHandler);

      mockTime.at(1, () => vine.setValue(id, value));

      mockTime.at(2, async () => wait(mockHandler).to.haveBeenCalledWith(value));
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

      const mockHandler = jasmine.createSpy('Handler');
      vine.listen(id, mockHandler, context);

      mockTime.at(1, () => vine.setValue(id, value, context));

      mockTime.at(2, async () => wait(mockHandler).to.haveBeenCalledWith(value));
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
      }).to.throwError(/cannot be found/);
    });
  });
});
