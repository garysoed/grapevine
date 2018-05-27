import { assert, should } from 'gs-testing/export/main';
import { ImmutableSet } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType } from 'gs-types/export';
import { NodeId } from '../component/node-id';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { Time } from '../component/time';
import { SourceNode } from './source-node';
import { VineNode } from './vine-node';

/**
 * @test
 */
class TestNode extends VineNode<number> {
  constructor(
      initTime: Time,
      id: NodeId<number>,
      private readonly computeValueHandler_: jasmine.Spy,
      private readonly sources_: ImmutableSet<SourceNode<any>>) {
    super(initTime, id);
  }

  computeValue_(context: BaseDisposable, time: Time): number {
    return this.computeValueHandler_(context, time);
  }

  getSources(): ImmutableSet<SourceNode<any>> {
    return this.sources_;
  }
}

describe('node.VineNode', () => {
  describe('getValue', () => {
    should(`compute the value correctly at latest time of the sources`, () => {
      const id = staticStreamId('id', NumberType);
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();
      const context = new BaseDisposable();

      const sourceNode = new SourceNode(staticSourceId('sourceId', NumberType), time0, 1);
      sourceNode.setValue(3, context, time1);

      const futureSourceNode = new SourceNode(staticSourceId('emptyId', NumberType), time2, 2);

      const value = 123;
      const mockComputeValueHandler = jasmine.createSpy('ComputeValueHandler');
      mockComputeValueHandler.and.returnValue(value);

      const node = new TestNode(
          time0,
          id,
          mockComputeValueHandler,
          ImmutableSet.of([sourceNode, futureSourceNode]));

      assert(node.getValue(context, time2)).to.be(value);
      assert(mockComputeValueHandler).to.haveBeenCalledWith(context, time1);
    });

    should(`return the cached value without recomputing if available`, () => {
      const id = staticStreamId('id', NumberType);
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();
      const context = new BaseDisposable();

      const sourceNode = new SourceNode(staticSourceId('sourceId', NumberType), time0, 1);
      sourceNode.setValue(3, context, time1);

      const value = 123;
      const mockComputeValueHandler = jasmine.createSpy('ComputeValueHandler');
      mockComputeValueHandler.and.returnValue(value);

      const node = new TestNode(
          time0,
          id,
          mockComputeValueHandler,
          ImmutableSet.of([sourceNode]));

      node.getValue(context, time2);
      mockComputeValueHandler.calls.reset();

      assert(node.getValue(context, time2)).to.be(value);
      assert(mockComputeValueHandler).toNot.haveBeenCalled();
    });
  });
});
