import { assert, createSpySubject, should, test } from 'gs-testing';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { source } from '../core/source';

import { Builder } from './builder';
import { Vine } from './vine';


const builder = new Builder();
const GLOBAL_SOURCE = source('globalSource', () => 1);


test('@grapevine/core/functional', () => {
  class TestClass {
    private readonly instanceSource = source('instanceSource', () => 2);
    private readonly vineStream = builder.vine();

    constructor(private readonly pad: number) { }

    getValue(vine: Vine): Observable<string> {
      return combineLatest([
        this.instanceSource.get(vine),
        GLOBAL_SOURCE.get(vine),
      ])
      .pipe(
          map(([instanceSource, globalSource]) => {
            return [
              instanceSource * this.pad,
              globalSource * this.pad,
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
      `2 1`,
      `3 1`,
      `3 5`,
    ]);
    assert(subject21).to.emitSequence([
      `4 2`,
      `10 2`,
      `10 10`,
    ]);

    const subject12 = createSpySubject(test1.getValue(vine2));
    const subject22 = createSpySubject(test2.getValue(vine2));
    test1.setSource(vine2, 4);
    test2.setSource(vine2, 6);
    GLOBAL_SOURCE.set(vine2, v => v + 5);
    assert(subject12).to.emitSequence([
      `2 1`,
      `4 1`,
      `4 6`,
    ]);
    assert(subject22).to.emitSequence([
      `4 2`,
      `12 2`,
      `12 12`,
    ]);
    assert(test1.getVine(vine1)).to.emitWith(vine1);
    assert(test1.getVine(vine2)).to.emitWith(vine2);
    assert(test2.getVine(vine1)).to.emitWith(vine1);
    assert(test2.getVine(vine2)).to.emitWith(vine2);
  });
});
