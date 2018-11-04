import { match, retryUntil, should } from 'gs-testing/export/main';
import { createSpy } from 'gs-testing/export/spy';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { getOrRegisterApp } from '../main/vine';

const {builder, vineIn, vineOut} = getOrRegisterApp('test');

describe('annotation.vineOut', () => {
  should(`set up the stream correctly`, async () => {
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
    const mockMainHandler = createSpy('MainHandler');
    const mockCHandler = createSpy('CHandler');
    const mockGHandler = createSpy('GHandler');
    const mockJHandler = createSpy('JHandler');

    const context = new TestClass();

    vine.listen(mockMainHandler, context, mainId);
    vine.listen(mockCHandler, context, cId);
    vine.listen(mockGHandler, context, gId);
    vine.listen(mockJHandler, context, jId);

    await retryUntil(() => mockMainHandler).to.equal(match.anySpyThat().haveBeenCalledWith('27'));
    await retryUntil(() => mockCHandler).to.equal(match.anySpyThat().haveBeenCalledWith(9));
    await retryUntil(() => mockGHandler).to.equal(match.anySpyThat().haveBeenCalledWith(13));

    vine.setValue(dId, 5, context);
    vine.setValue(hId, 6, context);

    await retryUntil(() => mockMainHandler).to.equal(match.anySpyThat().haveBeenCalledWith('63'));
    await retryUntil(() => mockGHandler).to.equal(match.anySpyThat().haveBeenCalledWith(15));
    await retryUntil(() => mockJHandler).to.equal(match.anySpyThat().haveBeenCalledWith(123));
  });
});
