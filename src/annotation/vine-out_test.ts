import { wait } from 'gs-testing/export/main';
import { MockTime } from 'gs-testing/export/mock';
import { should } from 'gs-testing/src/main/run';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType, StringType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { getOrRegisterApp } from '../main/vine';

const {builder, vineIn, vineOut} = getOrRegisterApp('test');

describe('annotation.vineOut', () => {
  let mockTime: MockTime;

  beforeEach(() => {
    mockTime = new MockTime();
  });

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

    /**
     * @test
     */
    class TestClass extends BaseDisposable {
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
    const mockMainHandler = jasmine.createSpy('MainHandler');
    const mockCHandler = jasmine.createSpy('CHandler');
    const mockGHandler = jasmine.createSpy('GHandler');

    const context = new TestClass();

    // Set events.
    mockTime.at(0, () => {
      vine.listen(mainId, mockMainHandler, context);
      vine.listen(cId, mockCHandler, context);
      vine.listen(gId, mockGHandler, context);
    });
    mockTime.at(2, () => {
      vine.setValue(dId, 5, context);
      vine.setValue(hId, 6, context);
    });

    // Set expectations.
    mockTime.at(1, async () => {
      await wait(mockMainHandler).to.haveBeenCalledWith('27');
      await wait(mockCHandler).to.haveBeenCalledWith(9);
      await wait(mockGHandler).to.haveBeenCalledWith(13);
    });
    mockTime.at(3, async () => {
      await wait(mockMainHandler).to.haveBeenCalledWith('63');
      await wait(mockGHandler).to.haveBeenCalledWith(15);
    });
    await mockTime.run();
  });
});
