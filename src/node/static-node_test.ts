import { assert, should } from 'gs-testing/export/main';
import { ImmutableSet } from 'gs-tools/export/collect';
import { NumberType } from 'gs-types/export';
import { NodeId } from '../component/node-id';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { Time } from '../component/time';
import { StaticNode } from './static-node';
import { StaticSourceNode } from './static-source-node';

/**
 * @test
 */
class TestNode extends StaticNode<number> {
  constructor(
      time: Time,
      id: NodeId<number>,
      private readonly computeValueHandler_: jasmine.Spy) {
    super(time, id);
  }

  protected async computeValue_(time: Time): Promise<number> {
    return this.computeValueHandler_(time);
  }

  getSources(): ImmutableSet<StaticSourceNode<any>> {
    throw new Error('Method not implemented.');
  }
}

describe('node.StaticNode', () => {
  describe('getValue', () => {
    should(`compute the value correctly at latest time of the sources`, async () => {
      const id = staticStreamId('id', NumberType);
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();

      const sourceNode = new StaticSourceNode(
          staticSourceId('sourceId', NumberType),
          time0,
          () => 1);
      sourceNode.setValue(3, time1);

      const futureSourceNode = new StaticSourceNode(
          staticSourceId('emptyId', NumberType),
          time2,
          () => 2);

      const value = 123;
      const mockComputeValueHandler = jasmine.createSpy('ComputeValueHandler');
      mockComputeValueHandler.and.returnValue(value);

      const node = new TestNode(time0, id, mockComputeValueHandler);
      spyOn(node, 'getSources').and.returnValue(ImmutableSet.of([sourceNode, futureSourceNode]));

      assert(await node.getValue(time2)).to.be(value);
      assert(mockComputeValueHandler).to.haveBeenCalledWith(time1);
    });

    should(`return the cached value without recomputing if available`, async () => {
      const id = staticStreamId('id', NumberType);
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();

      const sourceNode = new StaticSourceNode(
          staticSourceId('sourceId', NumberType),
          time0,
          () => 1);
      sourceNode.setValue(3, time1);

      const value = 123;
      const mockComputeValueHandler = jasmine.createSpy('ComputeValueHandler');
      mockComputeValueHandler.and.returnValue(value);

      const node = new TestNode(time0, id, mockComputeValueHandler);
      spyOn(node, 'getSources').and.returnValue(ImmutableSet.of([sourceNode]));

      await node.getValue(time2);
      mockComputeValueHandler.calls.reset();

      assert(await node.getValue(time2)).to.be(value);
      assert(mockComputeValueHandler).toNot.haveBeenCalled();
    });

    should(`throw error if the return value is of the wrong type`, async () => {
      const id = staticStreamId('id', NumberType);
      const time0 = Time.new();
      const time1 = time0.increment();

      const sourceNode = new StaticSourceNode(
          staticSourceId('sourceId', NumberType),
          time0,
          () => 1);
      sourceNode.setValue(3, time1);

      const mockComputeValueHandler = jasmine.createSpy('ComputeValueHandler');
      mockComputeValueHandler.and.returnValue('value');

      const node = new TestNode(time0, id, mockComputeValueHandler);
      spyOn(node, 'getSources').and.returnValue(ImmutableSet.of([sourceNode]));

      await assert(node.getValue(time1)).to.rejectWithError(/Return type of value/);
    });
  });
});
