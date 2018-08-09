import { assert, should } from 'gs-testing/export/main';
import { ImmutableList } from 'gs-tools/export/collect';
import { NumberType } from 'gs-types/export';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { Time } from '../component/time';
import { StaticSourceNode } from './static-source-node';
import { StaticStreamNode } from './static-stream-node';

describe('node.StaticStreamNode', () => {
  describe('getSources', () => {
    should(`recursively return the sources`, () => {
      const time = Time.new();

      // Nodes:
      // A
      // |- B
      // |  |- C
      // |  |- D
      // |
      // |- E
      const idA = staticStreamId('a', NumberType);
      const idB = staticStreamId('b', NumberType);
      const idC = staticSourceId('c', NumberType);
      const idD = staticSourceId('d', NumberType);
      const idE = staticSourceId('e', NumberType);

      const nodeC = new StaticSourceNode(idC, time, () => 1);
      const nodeD = new StaticSourceNode(idD, time, () => 2);
      const nodeE = new StaticSourceNode(idE, time, () => 3);
      const nodeB = new StaticStreamNode(
          idB,
          time,
          (c, d) => c * d,
          ImmutableList.of([nodeC, nodeD]));
      const nodeA = new StaticStreamNode(
          idA,
          time,
          (b, e) => b * e,
          ImmutableList.of([nodeB, nodeE]));

      assert(nodeA.getSources()).to.haveElements([nodeC, nodeD, nodeE]);
    });
  });

  describe('getValue', () => {
    should(`compute the value correctly`, async () => {
      const time = Time.new();
      const sourceNodeA = new StaticSourceNode(staticSourceId('a', NumberType), time, () => 2);
      const sourceNodeB = new StaticSourceNode(staticSourceId('b', NumberType), time, () => 3);

      const node = new StaticStreamNode(
          staticStreamId('id', NumberType),
          Time.new(),
          (a, b) => a * b,
          ImmutableList.of([sourceNodeA, sourceNodeB]));

      assert(await node.getValue(time)).to.equal(6);
    });

    should(`handle promises correctly`, async () => {
      const time = Time.new();
      const sourceNodeA = new StaticSourceNode(staticSourceId('a', NumberType), time, () => 2);
      const sourceNodeB = new StaticSourceNode(staticSourceId('b', NumberType), time, () => 3);

      const node = new StaticStreamNode(
          staticStreamId('id', NumberType),
          Time.new(),
          async (a, b) => a * b,
          ImmutableList.of([sourceNodeA, sourceNodeB]));

      assert(await node.getValue(time)).to.equal(6);
    });
  });
});
