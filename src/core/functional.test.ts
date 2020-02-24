import { assert, should, test } from 'gs-testing';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { source } from '../core/source';
import { stream } from '../core/stream';

import { Builder } from './builder';
import { Vine } from './vine';


const builder = new Builder();
const GLOBAL_SOURCE = source(() => new BehaviorSubject(1), globalThis);
const GLOBAL_STREAM = stream(
    vine => GLOBAL_SOURCE
        .get(vine)
        .pipe(map(value => value * 2)),
    globalThis,
);

test('@grapevine/core/functional', () => {
  class TestClass {
    private readonly instanceSource = source(() => new BehaviorSubject(2), this);
    private readonly instanceStream = stream(this.stream, this);
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
});
