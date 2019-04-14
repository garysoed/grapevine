import { assert, should, test } from '@gs-testing/main';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Builder } from './builder';
import { injectVine } from './inject-vine';
import { Vine } from './vine';

const builder = new Builder();
const globalSource = builder.source(() => new BehaviorSubject(1));
const globalStream = builder.stream(
    vine => globalSource
        .get(vine, globalThis)
        .pipe(map(value => value * 2)),
);

test('grapevine.core.functional', () => {
  class TestClass {
    private static readonly instanceSource = builder.source(() => new BehaviorSubject(2));
    private static readonly instanceStream = builder.stream(TestClass.prototype.stream);

    constructor(private readonly pad: number) { }

    getValue(vine: Vine): Observable<string> {
      return combineLatest(
          TestClass.instanceSource.get(vine, this),
          TestClass.instanceStream.get(vine, this),
          globalSource.get(vine, globalThis),
          globalStream.get(vine, globalThis),
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
      TestClass.instanceSource.get(vine, this).next(value);
    }

    // tslint:disable-next-line: prefer-function-over-method
    private stream(vine: Vine): Observable<number> {
      return TestClass.instanceSource.get(vine, this).pipe(map(value => value * 3));
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
    globalSource.get(vine1, globalThis).next(5);
    globalSource.get(vine2, globalThis).next(6);

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
    readonly globalSource = globalSource.asSubject();
    readonly globalStream = globalStream.asObservable();
    private readonly instanceSource = builder.source(() => new BehaviorSubject(2)).asSubject();
    private readonly instanceStream = builder.stream(this.stream).asObservable();

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
    const test11 = new TestInjectedClass(1);
    injectVine(vine1, test11);
    const test12 = new TestInjectedClass(1);
    injectVine(vine2, test12);
    const test21 = new TestInjectedClass(2);
    injectVine(vine1, test21);
    const test22 = new TestInjectedClass(2);
    injectVine(vine2, test22);

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
