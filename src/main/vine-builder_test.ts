import 'jasmine';

import { assert, should, test } from 'gs-testing/export/main';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { BehaviorSubject } from 'rxjs';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { VineBuilder } from './vine-builder';
import { $vine } from './vine-id';
import { VineImpl } from './vine-impl';

test('main.VineBuilder', () => {
  let builder: VineBuilder;

  beforeEach(() => {
    builder = new VineBuilder();
  });

  test('source', () => {
    should(`register the source correctly`, async () => {
      const sourceId = instanceSourceId('sourceId', NumberType);
      const context = new BaseDisposable();
      const initValue = 123;
      const value = 456;

      builder.source(sourceId, initValue);

      const vine = builder.run();

      const subject = new BehaviorSubject<number|null>(null);
      vine.getObservable(sourceId, context).subscribe(subject);

      assert(subject.getValue()).to.equal(initValue);

      vine.setValue(sourceId, value, context);
      assert(subject.getValue()).to.equal(value);
    });

    should(`throw error if the source is already registered`, () => {
      const sourceId = instanceSourceId('sourceId', NumberType);
      builder.source(sourceId, 123);

      assert(() => {
        builder.source(sourceId, 456);
      }).to.throwErrorWithMessage(/have been registered/);
    });
  });

  test('stream', () => {
    should(`set up the stream correctly`, async () => {
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
      const bId = staticStreamId('b', NumberType);
      const cId = instanceStreamId('c', NumberType);
      const dId = staticSourceId('d', NumberType);
      const eId = staticSourceId('e', NumberType);
      const fId = instanceSourceId('f', NumberType);
      const gId = instanceStreamId('g', NumberType);
      const hId = instanceSourceId('h', NumberType);

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

      const mainHandler = new BehaviorSubject<string|null>(null);
      const cHandler = new BehaviorSubject<number|null>(null);
      const gHandler = new BehaviorSubject<number|null>(null);
      vine.getObservable(mainId, context).subscribe(mainHandler);
      vine.getObservable(cId, context).subscribe(cHandler);
      vine.getObservable(gId, context).subscribe(gHandler);

      const vineSubject = new BehaviorSubject<VineImpl|null>(null);
      vine.getObservable($vine).subscribe(vineSubject);
      assert(vineSubject.getValue()).to.equal(vine);
      assert(mainHandler.getValue()).to.equal('27');
      assert(cHandler.getValue()).to.equal(9);
      assert(gHandler.getValue()).to.equal(13);

      vine.setValue(dId, 5);
      vine.setValue(hId, 6, context);
      assert(mainHandler.getValue()).to.equal('63');
      assert(gHandler.getValue()).to.equal(15);
    });

    should(`throw error if the stream is already registered`, () => {
      const id = staticStreamId('id', NumberType);
      const vId = staticStreamId('vId', NumberType);

      builder.stream(id, v => v, vId);

      assert(() => {
        builder.stream(id, v => v, vId);
      }).to.throwErrorWithMessage(/been registered/);
    });

    should(`throw error if a dependency node cannot be found`, () => {
      const id = staticStreamId('id', NumberType);
      const vId = staticStreamId('vId', NumberType);

      builder.stream(id, v => v, vId);

      assert(() => {
        builder.run();
      }).to.throwErrorWithMessage(/not found/);
    });

    should(`throw error if the nodes form a cycle`, () => {
      const aId = staticStreamId('a', NumberType);
      const bId = staticStreamId('b', NumberType);
      const cId = staticStreamId('c', NumberType);

      builder.stream(aId, b => b, bId);
      builder.stream(bId, c => c, cId);
      builder.stream(cId, a => a, aId);

      assert(() => {
        builder.run();
      }).to.throwErrorWithMessage(/cyclic dependency/i);
    });
  });
});
