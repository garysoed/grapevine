import { assert, should } from 'gs-testing/export/main';
import { createSpy, fake, resetCalls, Spy } from 'gs-testing/export/spy';
import { ImmutableSet } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { Time } from '../component/time';
import { InstanceNode } from './instance-node';
import { InstanceSourceNode } from './instance-source-node';
import { StaticSourceNode } from './static-source-node';

/**
 * @test
 */
class TestNode extends InstanceNode<number> {
  constructor(
      time: Time,
      id: NodeId<number>,
      private readonly computeValueHandler_: Spy<Promise<number>>) {
    super(time, id);
  }

  protected async computeValue_(context: BaseDisposable, time: Time): Promise<number> {
    // tslint:disable-next-line:no-non-null-assertion
    const value = await this.computeValueHandler_(context, time)!;

    return value;
  }

  getSources(): ImmutableSet<InstanceSourceNode<any> | StaticSourceNode<any>> {
    throw new Error('Method not implemented.');
  }
}

describe('node.InstanceNode', () => {
  describe('getValue', () => {
    should(`compute the value correctly at latest time of the sources`, async () => {
      const id = instanceStreamId('id', NumberType);
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();
      const context = new BaseDisposable();

      const sourceNode = new InstanceSourceNode(
          instanceSourceId('sourceId', NumberType),
          time0,
          () => 1);
      sourceNode.setValue(3, context, time1);

      const futureSourceNode = new InstanceSourceNode(
          instanceSourceId('emptyId', NumberType),
          time2,
          () => 2);

      const value = 123;
      const mockComputeValueHandler = createSpy<Promise<number>>('ComputeValueHandler');
      fake(mockComputeValueHandler).always().return(Promise.resolve(value));

      const node = new TestNode(time0, id, mockComputeValueHandler);
      spyOn(node, 'getSources').and.returnValue(ImmutableSet.of([sourceNode, futureSourceNode]));

      assert(await node.getValue(context, time2)).to.equal(value);
      assert(mockComputeValueHandler).to.haveBeenCalledWith(context, time1);
    });

    should(`return the cached value without recomputing if available`, async () => {
      const id = instanceStreamId('id', NumberType);
      const time0 = Time.new();
      const time1 = time0.increment();
      const time2 = time1.increment();
      const context = new BaseDisposable();

      const sourceNode = new InstanceSourceNode(
          instanceSourceId('sourceId', NumberType),
          time0,
          () => 1);
      sourceNode.setValue(3, context, time1);

      const value = 123;
      const mockComputeValueHandler = createSpy<Promise<number>>('ComputeValueHandler');
      fake(mockComputeValueHandler).always().return(Promise.resolve(value));

      const node = new TestNode(time0, id, mockComputeValueHandler);
      spyOn(node, 'getSources').and.returnValue(ImmutableSet.of([sourceNode]));

      await node.getValue(context, time2);
      resetCalls(mockComputeValueHandler);

      assert(await node.getValue(context, time2)).to.equal(value);
      assert(mockComputeValueHandler).toNot.haveBeenCalled();
    });

    should(`throw error if the return value is of the wrong type`, async () => {
      const id = instanceStreamId('id', NumberType);
      const time0 = Time.new();
      const time1 = time0.increment();
      const context = new BaseDisposable();

      const sourceNode = new InstanceSourceNode(
          instanceSourceId('sourceId', NumberType),
          time0,
          () => 1);
      sourceNode.setValue(3, context, time1);

      const mockComputeValueHandler = createSpy<Promise<number>>('ComputeValueHandler');
      fake(mockComputeValueHandler).always().return(Promise.resolve('value' as any));

      const node = new TestNode(time0, id, mockComputeValueHandler);
      spyOn(node, 'getSources').and.returnValue(ImmutableSet.of([sourceNode]));

      await assert(node.getValue(context, time1)).to.rejectWithErrorMessage(/Return type of value/);
    });
  });
});
