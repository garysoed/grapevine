import { assert, should } from 'gs-testing/export/main';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { BehaviorSubject } from 'rxjs';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { getOrRegisterApp } from '../main/vine';

const {builder, vineIn, vineOut} = getOrRegisterApp('test');

describe('annotation.vineOut', () => {
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
      @vineOut(jId) public readonly j: number = 123;

      @vineOut(aId)
      providesA(
          @vineIn(bId) b: number,
          @vineIn(cId) c: number): number {
        return b * c;
      }

      @vineOut(bId)
      providesB(
          @vineIn(dId) d: number,
          @vineIn(eId) e: number): number {
        return d + e;
      }

      @vineOut(cId)
      providesC(@vineIn(fId) f: number): number {
        return f * f;
      }

      @vineOut(gId)
      providesG(
          @vineIn(cId) c: number,
          @vineIn(hId) h: number): number {
        return c + h;
      }

      @vineOut(mainId)
      providesMain(@vineIn(aId) a: number): string {
        return `${a}`;
      }
    }

    builder.source(dId, 1);
    builder.source(eId, 2);
    builder.source(fId, 3);
    builder.source(hId, 4);

    const vine = builder.run();
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
