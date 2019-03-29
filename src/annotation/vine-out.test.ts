import { assert, setup, should, teardown, test } from '@gs-testing/main';
import { BaseDisposable } from '@gs-tools/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { clearApps, getOrRegisterApp, VineApp } from '../main/vine';

test('annotation.vineOut', () => {
  let _v: VineApp;

  setup(() => {
    _v = getOrRegisterApp('test');
  });

  teardown(() => {
    clearApps();
  });

  should(`set up the stream correctly`, () => {
    const mainId = instanceStreamId('main', StringType);
    const aId = instanceStreamId('a', NumberType);
    const bId = instanceStreamId('b', NumberType);
    const cId = instanceStreamId('c', NumberType);
    const dId = instanceSourceId('d', NumberType);
    const eId = instanceSourceId('e', NumberType);
    const fId = instanceSourceId('f', NumberType);
    const gId = instanceStreamId('g', NumberType);
    const hId = instanceSourceId('h', NumberType);
    const jId = instanceStreamId('j', NumberType);

    /**
     * @test
     */
    class TestClass extends BaseDisposable {
      @_v.vineOut(jId) public readonly j: number = 123;

      @_v.vineOut(aId)
      providesA(
          @_v.vineIn(bId) b: Observable<number>,
          @_v.vineIn(cId) c: Observable<number>): Observable<number> {
        return combineLatest(b, c).pipe(map(([b, c]) => b * c));
      }

      @_v.vineOut(bId)
      providesB(
          @_v.vineIn(dId) d: Observable<number>,
          @_v.vineIn(eId) e: Observable<number>): Observable<number> {
        return combineLatest(d, e).pipe(map(([d, e]) => d + e));
      }

      @_v.vineOut(cId)
      providesC(@_v.vineIn(fId) f: Observable<number>): Observable<number> {
        return f.pipe(map(f => f * f));
      }

      @_v.vineOut(gId)
      providesG(
          @_v.vineIn(cId) c: Observable<number>,
          @_v.vineIn(hId) h: Observable<number>): Observable<number> {
        return combineLatest(c, h).pipe(map(([c, h]) => c + h));
      }

      @_v.vineOut(mainId)
      providesMain(@_v.vineIn(aId) a: Observable<number>): Observable<string> {
        return a.pipe(map(a => `${a}`));
      }
    }

    _v.builder.source(dId, 1);
    _v.builder.source(eId, 2);
    _v.builder.source(fId, 3);
    _v.builder.source(hId, 4);

    const vine = _v.builder.run([TestClass]);
    const mainSubject = new BehaviorSubject<string|null>(null);
    const cSubject = new BehaviorSubject<number|null>(null);
    const gSubject = new BehaviorSubject<number|null>(null);
    const jSubject = new BehaviorSubject<number|null>(null);

    const context = new TestClass();

    vine.getObservable(mainId, context).subscribe(mainSubject);
    vine.getObservable(cId, context).subscribe(cSubject);
    vine.getObservable(gId, context).subscribe(gSubject);
    vine.getObservable(jId, context).subscribe(jSubject);

    assert(mainSubject.getValue()).to.equal('27');
    assert(cSubject.getValue()).to.equal(9);
    assert(gSubject.getValue()).to.equal(13);

    vine.setValue(dId, 5, context);
    vine.setValue(hId, 6, context);

    assert(mainSubject.getValue()).to.equal('63');
    assert(gSubject.getValue()).to.equal(15);
    assert(jSubject.getValue()).to.equal(123);
  });
});
