import { assert, should, test } from '@gs-testing/main';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Builder } from './builder';
import { DelayedSubject } from './delayed_subject';
import { newInstance } from './new_instance';
import { Source } from './source';
import { Stream } from './stream';
import { Vine } from './vine';

const builder = new Builder();
const globalSource = builder.createSource(() => new BehaviorSubject(1));
const globalStream = builder.createStream(
    vine => globalSource
        .get(vine)
        .pipe(map(value => value * 2)),
);

test('grapevine.core.functional', () => {
  class TestClass {
    private readonly instanceSource: Source<number> =
        builder.createSource(() => new BehaviorSubject(2));
    private readonly instanceStream: Stream<number, this> = builder.createStream(this.stream, this);

    constructor(private readonly pad: number) { }

    getValue(vine: Vine): Observable<string> {
      return combineLatest(
          this.instanceSource.get(vine),
          this.instanceStream.get(vine),
          globalSource.get(vine),
          globalStream.get(vine),
      )
      .pipe(
          map(([instanceSource, instanceStream, globalSource, globalStream]) => {
            return [
              instanceSource * this.pad,
              instanceStream,
              globalSource * this.pad,
              globalStream,
            ].join(' ');
          }),
      );
    }

    setSource(vine: Vine, value: number): void {
      this.instanceSource.get(vine).next(value);
    }

    private stream(vine: Vine): Observable<number> {
      return this.instanceSource.get(vine).pipe(map(value => value * 3));
    }
  }

  should(`provide the correct values for non injected class`, async () => {
    const vine1 = builder.build('test1');
    const vine2 = builder.build('test2');
    const test1 = new TestClass(1);
    const test2 = new TestClass(2);

    const subject11 = new ReplaySubject(6);
    test1.getValue(vine1).subscribe(subject11);

    const subject12 = new ReplaySubject(6);
    test1.getValue(vine2).subscribe(subject12);

    const subject21 = new ReplaySubject(6);
    test2.getValue(vine1).subscribe(subject21);

    const subject22 = new ReplaySubject(6);
    test2.getValue(vine2).subscribe(subject22);

    test1.setSource(vine1, 3);
    test1.setSource(vine2, 4);
    test2.setSource(vine1, 5);
    test2.setSource(vine2, 6);
    globalSource.get(vine1).next(5);
    globalSource.get(vine2).next(6);

    await assert(subject11).to.emitSequence([
      `2 6 1 2`,
      `3 6 1 2`,
      `3 9 1 2`,
      `3 9 5 2`,
      `3 9 5 10`,
    ]);
    await assert(subject12).to.emitSequence([
      `2 6 1 2`,
      `4 6 1 2`,
      `4 12 1 2`,
      `4 12 6 2`,
      `4 12 6 12`,
    ]);
    await assert(subject21).to.emitSequence([
      `4 6 2 2`,
      `10 6 2 2`,
      `10 15 2 2`,
      `10 15 10 2`,
      `10 15 10 10`,
    ]);
    await assert(subject22).to.emitSequence([
      `4 6 2 2`,
      `12 6 2 2`,
      `12 18 2 2`,
      `12 18 12 2`,
      `12 18 12 12`,
    ]);
  });

  class TestInjectedClass {
    readonly globalSource: DelayedSubject<number> = builder.createSubject(globalSource);
    readonly globalStream: Observable<number> = builder.createObservable(globalStream);
    private readonly instanceSource: DelayedSubject<number> =
        builder.createSubject(builder.createSource(() => new BehaviorSubject(2)));
    private readonly instanceStream: Observable<number> =
        builder.createObservable(builder.createStream(this.stream, this));

    constructor(private readonly pad: number) { }

    getValue(): Observable<string> {
      return combineLatest(
          this.instanceSource,
          this.instanceStream,
          this.globalSource,
          this.globalStream,
      )
      .pipe(
          map(([instanceSource, instanceStream, globalSource, globalStream]) => {
            return [
              instanceSource * this.pad,
              instanceStream,
              globalSource * this.pad,
              globalStream,
            ].join(' ');
          }),
      );
    }

    setValue(value: number): void {
      this.instanceSource.next(value);
    }

    private stream(vine: Vine): Observable<number> {
      return this.instanceSource.pipe(map(value => value * 3));
    }
  }

  should(`provide the correct values for injected class`, async () => {
    const vine1 = builder.build('test1');
    const vine2 = builder.build('test2');
    const test11 = newInstance(vine1, TestInjectedClass, 1);
    const test12 = newInstance(vine2, TestInjectedClass, 1);
    const test21 = newInstance(vine1, TestInjectedClass, 2);
    const test22 = newInstance(vine2, TestInjectedClass, 2);

    const subject11 = new ReplaySubject(6);
    test11.getValue().subscribe(subject11);

    const subject12 = new ReplaySubject(6);
    test12.getValue().subscribe(subject12);

    const subject21 = new ReplaySubject(6);
    test21.getValue().subscribe(subject21);

    const subject22 = new ReplaySubject(6);
    test22.getValue().subscribe(subject22);

    test11.setValue(3);
    test12.setValue(4);
    test21.setValue(5);
    test22.setValue(6);
    test11.globalSource.next(7);
    test12.globalSource.next(8);

    await assert(subject11).to.emitSequence([
      `2 6 1 2`,
      `3 6 1 2`,
      `3 9 1 2`,
      `3 9 7 2`,
      `3 9 7 14`,
    ]);
    await assert(subject12).to.emitSequence([
      `2 6 1 2`,
      `4 6 1 2`,
      `4 12 1 2`,
      `4 12 8 2`,
      `4 12 8 16`,
    ]);
    await assert(subject21).to.emitSequence([
      `4 6 2 2`,
      `10 6 2 2`,
      `10 15 2 2`,
      `10 15 14 2`,
      `10 15 14 14`,
    ]);
    await assert(subject22).to.emitSequence([
      `4 6 2 2`,
      `12 6 2 2`,
      `12 18 2 2`,
      `12 18 16 2`,
      `12 18 16 16`,
    ]);
  });
});
