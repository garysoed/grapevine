import { assert, createSpySubject, should, test } from 'gs-testing';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { source } from '../core/source';
import { stream } from '../core/stream';

import { Builder } from './builder';
import { Vine } from './vine';


const builder = new Builder();
const GLOBAL_SOURCE = source('globalSource', () => 1);
const GLOBAL_STREAM = stream(
    'globalStream',
    vine => GLOBAL_SOURCE
        .get(vine)
        .pipe(map(value => value * 2)),
);

class TestWrapper { }
const WRAPPER_STREAM = stream(
    'globalSource',
    vine => GLOBAL_SOURCE.get(vine).pipe(
        map(() => new TestWrapper()),
    ),
);

test('@grapevine/core/functional', () => {
  class TestClass {
    private readonly instanceSource = source('instanceSource', () => 2);
    private readonly instanceStream = stream('instanceStream', vine => this.stream(vine));
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
      this.instanceSource.set(vine, () => value);
    }

    // tslint:disable-next-line: prefer-function-over-method
    private stream(vine: Vine): Observable<number> {
      return this.instanceSource.get(vine).pipe(map(value => value * 3));
    }
  }

  should(`provide the correct values for non injected class`, () => {
    const vine1 = builder.build('test1');
    const vine2 = builder.build('test2');
    const test1 = new TestClass(1);
    const test2 = new TestClass(2);

    const subject11 = createSpySubject(test1.getValue(vine1));
    const subject21 = createSpySubject(test2.getValue(vine1));

    test1.setSource(vine1, 3);
    test2.setSource(vine1, 5);
    GLOBAL_SOURCE.set(vine1, v => v + 4);

    assert(subject11).to.emitSequence([
      `2 6 1 2`,
      `3 6 1 2`,
      `3 9 1 2`,
      `3 9 5 2`,
      `3 9 5 10`,
    ]);
    assert(subject21).to.emitSequence([
      `4 6 2 2`,
      `10 6 2 2`,
      `10 15 2 2`,
      `10 15 2 10`,
      `10 15 10 10`,
    ]);

    const subject12 = createSpySubject(test1.getValue(vine2));
    const subject22 = createSpySubject(test2.getValue(vine2));
    test1.setSource(vine2, 4);
    test2.setSource(vine2, 6);
    GLOBAL_SOURCE.set(vine2, v => v + 5);
    assert(subject12).to.emitSequence([
      `2 6 1 2`,
      `4 6 1 2`,
      `4 12 1 2`,
      `4 12 6 2`,
      `4 12 6 12`,
    ]);
    assert(subject22).to.emitSequence([
      `4 6 2 2`,
      `12 6 2 2`,
      `12 18 2 2`,
      `12 18 2 12`,
      `12 18 12 12`,
    ]);
    assert(test1.getVine(vine1)).to.emitWith(vine1);
    assert(test1.getVine(vine2)).to.emitWith(vine2);
    assert(test2.getVine(vine1)).to.emitWith(vine1);
    assert(test2.getVine(vine2)).to.emitWith(vine2);
  });

  should(`provide the same instance with multiple subscriptions to streams and if the dependency emits`, () => {
    const vine = builder.build('test');

    const isEqual$ = createSpySubject(
        combineLatest([WRAPPER_STREAM.get(vine), WRAPPER_STREAM.get(vine)]).pipe(
            map(([obj1, obj2]) => obj1 === obj2),
        ),
    );
    GLOBAL_SOURCE.set(vine, () => 3);

    assert(isEqual$).to.emitSequence([
      true, // initial value of source
      false, // one of the wrappers is updated
      true, // both wrappers are updated
    ]);
  });
});
