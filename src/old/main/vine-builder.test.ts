import 'jasmine';

import { assert, setup, should, teardown, test } from '@gs-testing/main';
import { BaseDisposable } from '@gs-tools/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { clearApps, getOrRegisterApp, VineApp } from './vine';
import { $vine } from './vine-id';
import { VineImpl } from './vine-impl';

test('main.VineBuilder', () => {
  let _v: VineApp;
  setup(() => {
    _v = getOrRegisterApp('test');
  });

  teardown(() => {
    clearApps();
  });

  test('source', () => {
    should(`register the source correctly`, () => {
      const sourceId = instanceSourceId('sourceId', NumberType);
      const context = new BaseDisposable();
      const initValue = 123;
      const value = 456;

      _v.builder.source(sourceId, initValue);

      const vine = _v.builder.run([]);

      const subject = new BehaviorSubject<number|null>(null);
      vine.getObservable(sourceId, context).subscribe(subject);

      assert(subject.getValue()).to.equal(initValue);

      vine.setValue(sourceId, value, context);
      assert(subject.getValue()).to.equal(value);
    });

    should(`throw error if the source is already registered`, () => {
      const sourceId = instanceSourceId('sourceId', NumberType);
      _v.builder.source(sourceId, 123);

      assert(() => {
        _v.builder.source(sourceId, 456);
      }).to.throwErrorWithMessage(/have been registered/);
    });
  });

  test('stream', () => {
    should(`set up the stream correctly`, () => {
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

      _v.builder.stream(
          mainId,
          (value: Observable<number>) => value.pipe(map(v => `${v}`)), aId);
      _v.builder.stream(
          aId,
          (b: Observable<number>, c: Observable<number>) =>
              combineLatest(b, c).pipe(map(([b, c]) => b * c)),
          bId,
          cId);
      _v.builder.stream(
          bId,
          (d: Observable<number>, e: Observable<number>) =>
              combineLatest(d, e).pipe(map(([d, e]) => d + e)),
          dId,
          eId);
      _v.builder.stream(cId, (f: Observable<number>) => f.pipe(map(f => f * f)), fId);
      _v.builder.stream(
          gId,
          (h: Observable<number>, c: Observable<number>) =>
              combineLatest(h, c).pipe(map(([h, c]) => h + c)),
          hId,
          cId);
      _v.builder.source(dId, 1);
      _v.builder.source(eId, 2);
      _v.builder.source(fId, 3);
      _v.builder.source(hId, 4);
      const vine = _v.builder.run([]);

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

      _v.builder.stream(id, v => v, vId);

      assert(() => {
        _v.builder.stream(id, v => v, vId);
      }).to.throwErrorWithMessage(/been registered/);
    });

    should(`throw error if a dependency node cannot be found`, () => {
      const id = staticStreamId('id', NumberType);
      const vId = staticStreamId('vId', NumberType);

      _v.builder.stream(id, v => v, vId);

      assert(() => {
        _v.builder.run([]);
      }).to.throwErrorWithMessage(/not found/);
    });

    should(`throw error if the nodes form a cycle`, () => {
      const aId = staticStreamId('a', NumberType);
      const bId = staticStreamId('b', NumberType);
      const cId = staticStreamId('c', NumberType);

      _v.builder.stream(aId, b => b, bId);
      _v.builder.stream(bId, c => c, cId);
      _v.builder.stream(cId, a => a, aId);

      assert(() => {
        _v.builder.run([]);
        console.log('done');
      }).to.throwErrorWithMessage(/cyclic dependency/i);
    });
  });
});
