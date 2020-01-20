import { assert, should, test } from '@gs-testing';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject } from '@rxjs';
import { map } from '@rxjs/operators';

import { Builder } from './builder';
import { injectVine } from './inject-vine';
import { Vine } from './vine';

const builder = new Builder();
const GLOBAL_SOURCE = builder.source(() => new BehaviorSubject(1), globalThis);
const GLOBAL_STREAM = builder.stream(
    vine => GLOBAL_SOURCE
        .get(vine)
        .pipe(map(value => value * 2)),
    globalThis,
);

test('@grapevine/core/functional', () => {
  class TestClass {
    private readonly instanceSource = builder.source(() => new BehaviorSubject(2), this);
    private readonly instanceStream = builder.stream(this.stream, this);
    private readonly vineStream = builder.vine();

    constructor(private readonly pad: number) { }

    getValue(vine: Vine): Observable<string> {
      return combineLatest([
        this.instanceSource.get(vine),
        this.instanceStream.get(vine),
        GLOBAL_SOURCE.get(vine),
        GLOBAL_STREAM.get(vine),
      ])
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

    getVine(vine: Vine): Observable<Vine> {
      return this.vineStream.get(vine);
    }

    setSource(vine: Vine, value: number): void {
      this.instanceSource.get(vine).next(value);
    }

    // tslint:disable-next-line: prefer-function-over-method
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
    GLOBAL_SOURCE.get(vine1).next(5);
    GLOBAL_SOURCE.get(vine2).next(6);

    assert(subject11).to.emitSequence([
      `2 6 1 2`,
      `3 6 1 2`,
      `3 9 1 2`,
      `3 9 5 2`,
      `3 9 5 10`,
    ]);
    assert(subject12).to.emitSequence([
      `2 6 1 2`,
      `4 6 1 2`,
      `4 12 1 2`,
      `4 12 6 2`,
      `4 12 6 12`,
    ]);
    assert(subject21).to.emitSequence([
      `4 6 2 2`,
      `10 6 2 2`,
      `10 15 2 2`,
      `10 15 10 2`,
      `10 15 10 10`,
    ]);
    assert(subject22).to.emitSequence([
      `4 6 2 2`,
      `12 6 2 2`,
      `12 18 2 2`,
      `12 18 12 2`,
      `12 18 12 12`,
    ]);
    assert(test1.getVine(vine1)).to.emitWith(vine1);
    assert(test1.getVine(vine2)).to.emitWith(vine2);
    assert(test2.getVine(vine1)).to.emitWith(vine1);
    assert(test2.getVine(vine2)).to.emitWith(vine2);
  });

  class TestInjectedClass {
    readonly globalObs = GLOBAL_STREAM.asObservable();
    readonly globalSbj = GLOBAL_SOURCE.asSubject();
    private readonly instanceSource = builder
        .source(() => new BehaviorSubject(2), this)
        .asSubject();
    private readonly instanceStream = builder
        .stream(this.stream, this)
        .asObservable();
    private readonly vineObs = builder.vine().asObservable();

    constructor(private readonly pad: number) { }

    getValue(): Observable<string> {
      return combineLatest([
        this.instanceSource,
        this.instanceStream,
        this.globalSbj,
        this.globalObs,
      ])
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

    getVine(): Observable<Vine> {
      return this.vineObs;
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
    test11.globalSbj.next(7);
    test12.globalSbj.next(8);

    assert(subject11).to.emitSequence([
      `2 6 1 2`,
      `3 6 1 2`,
      `3 9 1 2`,
      `3 9 7 2`,
      `3 9 7 14`,
    ]);
    assert(subject12).to.emitSequence([
      `2 6 1 2`,
      `4 6 1 2`,
      `4 12 1 2`,
      `4 12 8 2`,
      `4 12 8 16`,
    ]);
    assert(subject21).to.emitSequence([
      `4 6 2 2`,
      `10 6 2 2`,
      `10 15 2 2`,
      `10 15 14 2`,
      `10 15 14 14`,
    ]);
    assert(subject22).to.emitSequence([
      `4 6 2 2`,
      `12 6 2 2`,
      `12 18 2 2`,
      `12 18 16 2`,
      `12 18 16 16`,
    ]);

    assert(test11.getVine()).to.emitWith(vine1);
    assert(test12.getVine()).to.emitWith(vine2);
    assert(test21.getVine()).to.emitWith(vine1);
    assert(test22.getVine()).to.emitWith(vine2);
  });
});
