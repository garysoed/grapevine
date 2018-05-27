import 'jasmine';

import { assert } from 'gs-testing/export/main';
import { MockTime } from 'gs-testing/export/mock';
import { ImmutableList, ImmutableMap } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
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
    mockTime.inject(window);
  });

  describe('listen', () => {
    it(`should call the handler correctly for source IDs`, () => {
      const time = Time.new();
      const id = staticSourceId('id', NumberType);
      const initValue = 1;
      const newValue = 2;
      const newerValue = 4;
      const sourceNode = new SourceNode(id, time, initValue);

      const context = new BaseDisposable();
      const vine = new VineImpl(
          time,
          ImmutableMap.of([[id, sourceNode]]),
          ImmutableMap.of(),
          window);

      const mockHandler = jasmine.createSpy('Handler');
      const unlistenFn = vine.listen(id, context, mockHandler);

      mockTime.at(1, () => vine.setValue(id, context, newValue));
      mockTime.at(3, () => {
        unlistenFn();
        vine.setValue(id, context, newerValue);
      });

      mockTime.at(0, () => assert(mockHandler).to.haveBeenCalledWith(initValue));
      mockTime.at(2, () => assert(mockHandler).to.haveBeenCalledWith(newValue));
      mockTime.at(4, () => assert(mockHandler).toNot.haveBeenCalledWith(newerValue));
      mockTime.run();
    });

    it(`should call the handler correctly for stream IDs`, () => {
      const time = Time.new();
      const sourceId = staticSourceId('sourceId', NumberType);
      const sourceNode = new SourceNode(sourceId, time, 1);

      const id = staticStreamId('streamId', NumberType);
      const streamNode = new StreamNode(
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
          window);

      const unlistenFn = vine.listen(id, context, mockHandler);
      mockTime.at(1, () => vine.setValue(sourceId, context, 2));
      mockTime.at(3, () => {
        unlistenFn();
        vine.setValue(sourceId, context, 4);
      });

      mockTime.at(0, () => assert(mockHandler).to.haveBeenCalledWith(1));
      mockTime.at(2, () => assert(mockHandler).to.haveBeenCalledWith(4));
      mockTime.at(4, () => assert(mockHandler).toNot.haveBeenCalledWith(16));
      mockTime.run();
    });

    it(`should throw error if the node cannot be found`, () => {
      const nodeId = staticSourceId('sourceId', NumberType);
      const context = new BaseDisposable();
      const vine = new VineImpl(Time.new(), ImmutableMap.of(), ImmutableMap.of(), window);

      assert(() => {
        vine.listen(nodeId, context, () => undefined);
      }).to.throwError(/cannot be found/);
    });
  });

  describe('setValue', () => {
    it(`should set the value correctly`, () => {
      const time = Time.new();
      const id = staticSourceId('id', NumberType);
      const value = 2;
      const sourceNode = new SourceNode(id, time, 1);

      const context = new BaseDisposable();
      const vine = new VineImpl(
          time,
          ImmutableMap.of([[id, sourceNode]]),
          ImmutableMap.of(),
          window);

      const mockHandler = jasmine.createSpy('Handler');
      vine.listen(id, context, mockHandler);

      mockTime.at(1, () => vine.setValue(id, context, value));

      mockTime.at(2, () => assert(mockHandler).to.haveBeenCalledWith(value));
      mockTime.run();
    });

    it(`should throw error if the node cannot be found`, () => {
      const nodeId = staticSourceId('sourceId', NumberType);
      const context = new BaseDisposable();
      const vine = new VineImpl(Time.new(), ImmutableMap.of(), ImmutableMap.of(), window);

      assert(() => {
        vine.setValue(nodeId, context, 12);
      }).to.throwError(/cannot be found/);
    });
  });
});
