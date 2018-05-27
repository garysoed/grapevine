import 'jasmine';

import { assert } from 'gs-testing/export/main';
import { MockTime } from 'gs-testing/export/mock';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { staticStreamId } from '../component/static-stream-id';
import { VineBuilder } from './vine-builder';

describe('main.VineBuilder', () => {
  let mockTime: MockTime;
  let builder: VineBuilder;

  beforeEach(() => {
    mockTime = new MockTime();
    mockTime.inject(window);
    builder = new VineBuilder(window);
  });

  describe('source', () => {
    it(`should register the source correctly`, () => {
      const sourceId = instanceSourceId('sourceId', NumberType);
      const context = new BaseDisposable();
      const mockHandler = jasmine.createSpy('Handler');
      const initValue = 123;
      const value = 456;

      builder.source(sourceId, initValue);

      const vine = builder.run();

      mockTime.at(0, () => {
        vine.listen(sourceId, context, mockHandler);
        vine.setValue(sourceId, context, value);
      });

      mockTime.at(1, () => {
        assert(mockHandler).to.haveBeenCalledWith(initValue);
        assert(mockHandler).to.haveBeenCalledWith(value);
      });

      mockTime.run();
    });

    it(`should throw error if the source is already registered`, () => {
      const sourceId = instanceSourceId('sourceId', NumberType);
      builder.source(sourceId, 123);

      assert(() => {
        builder.source(sourceId, 456);
      }).to.throwError(/have been registered/);
    });
  });

  describe('stream', () => {
    it(`should set up the stream correctly`, () => {
      // Tree:
      // main ('27')
      // |- A (63)
      //    |- B (7)
      //       |- D (5)
      //       |- E (2)
      //    |- C (9)
      //       |- F (3)
      // |-----|
      // G (13)
      // |- H (4)
      const mainId = instanceStreamId('main', StringType);
      const aId = instanceStreamId('a', NumberType);
      const bId = instanceStreamId('b', NumberType);
      const cId = instanceStreamId('c', NumberType);
      const dId = instanceSourceId('d', NumberType);
      const eId = instanceSourceId('e', NumberType);
      const fId = instanceSourceId('f', NumberType);
      const gId = instanceStreamId('g', NumberType);
      const hId = instanceSourceId('h', NumberType);

      const mockMainHandler = jasmine.createSpy('MainHandler');
      const mockCHandler = jasmine.createSpy('CHandler');
      const mockGHandler = jasmine.createSpy('GHandler');
      const context = new BaseDisposable();

      builder.stream(mainId, (value: number) => `${value}`, aId);
      builder.stream(aId, (b: number, c: number) => b * c, bId, cId);
      builder.stream(bId, (d: number, e: number) => d + e, dId, eId);
      builder.stream(cId, (f: number) => f * f, fId);
      builder.stream(gId, (h: number, c: number) => h + c, hId, cId);
      builder.source(dId, 1);
      builder.source(eId, 2);
      builder.source(fId, 3);
      builder.source(hId, 4);
      const vine = builder.run();

      // Set events.
      mockTime.at(0, () => {
        vine.listen(mainId, context, mockMainHandler);
        vine.listen(cId, context, mockCHandler);
        vine.listen(gId, context, mockGHandler);
      });
      mockTime.at(2, () => {
        vine.setValue(dId, context, 5);
        vine.setValue(hId, context, 6);
      });

      // Set expectations.
      mockTime.at(1, () => {
        assert(mockMainHandler).to.haveBeenCalledWith('27');
        assert(mockCHandler).to.haveBeenCalledWith(9);
        assert(mockGHandler).to.haveBeenCalledWith(13);
      });
      mockTime.at(3, () => {
        assert(mockMainHandler).to.haveBeenCalledWith('63');
        assert(mockGHandler).to.haveBeenCalledWith(15);
      });
      mockTime.run();
    });

    it(`should throw error if the stream is already registered`, () => {
      const id = staticStreamId('id', NumberType);
      const vId = staticStreamId('vId', NumberType);

      builder.stream(id, v => v, vId);

      assert(() => {
        builder.stream(id, v => v, vId);
      }).to.throwError(/been registered/);
    });

    it(`should throw error if a dependency node cannot be found`, () => {
      const id = staticStreamId('id', NumberType);
      const vId = staticStreamId('vId', NumberType);

      builder.stream(id, v => v, vId);

      assert(() => {
        builder.run();
      }).to.throwError(/not found/);
    });

    it(`should throw error if the nodes form a cycle`, () => {
      const aId = staticStreamId('a', NumberType);
      const bId = staticStreamId('b', NumberType);
      const cId = staticStreamId('c', NumberType);

      builder.stream(aId, b => b, bId);
      builder.stream(bId, c => c, cId);
      builder.stream(cId, a => a, aId);

      assert(() => {
        builder.run();
      }).to.throwError(/cyclic dependency/i);
    });
  });
});
