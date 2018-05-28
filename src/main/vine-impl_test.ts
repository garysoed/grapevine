import 'jasmine';

import { assert, should, wait } from 'gs-testing/export/main';
import { MockTime } from 'gs-testing/export/mock';
import { ImmutableList, ImmutableMap } from 'gs-tools/export/collect';
import { NumberType } from 'gs-types/export';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { Time } from '../component/time';
import { SourceNode } from '../node/source-node';
import { StreamNode } from '../node/stream-node';
import { VineImpl } from './vine-impl';

describe('main.VineImpl', () => {
  let mockTime: MockTime;

  beforeEach(() => {
    mockTime = new MockTime();
  });

  describe('listen', () => {
    should(`call the handler correctly for source IDs`, async () => {
      const time = Time.new();
      const id = staticSourceId('id', NumberType);
      const initValue = 1;
      const newValue = 2;
      const newerValue = 4;
      const sourceNode = new SourceNode(id, time, initValue);

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

    should(`call the handler correctly for stream IDs`, async () => {
      const time = Time.new();
      const sourceId = staticSourceId('sourceId', NumberType);
      const sourceNode = new SourceNode(sourceId, time, 1);

      const id = staticStreamId('streamId', NumberType);
      const streamNode = new StreamNode(
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
    should(`set the value correctly`, async () => {
      const time = Time.new();
      const id = staticSourceId('id', NumberType);
      const value = 2;
      const sourceNode = new SourceNode(id, time, 1);

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
