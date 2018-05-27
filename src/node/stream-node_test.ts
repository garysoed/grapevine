import { assert, should } from 'gs-testing/export/main';
import { ImmutableList } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { staticSourceId } from '../component/static-source-id';
import { staticStreamId } from '../component/static-stream-id';
import { Time } from '../component/time';
import { SourceNode } from './source-node';
import { StreamNode } from './stream-node';

describe('node.StreamNode', () => {
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

      const nodeC = new SourceNode(idC, time, 1);
      const nodeD = new SourceNode(idD, time, 2);
      const nodeE = new SourceNode(idE, time, 3);
      const nodeB = new StreamNode(idB, time, (c, d) => c * d, ImmutableList.of([nodeC, nodeD]));
      const nodeA = new StreamNode(idA, time, (b, e) => b * e, ImmutableList.of([nodeB, nodeE]));

      assert(nodeA.getSources()).to.haveElements([nodeC, nodeD, nodeE]);
    });
  });

  describe('getValue', () => {
    should(`compute the value correctly`, () => {
      const time = Time.new();
      const sourceNodeA = new SourceNode(instanceSourceId('a', NumberType), time, 2);
      const sourceNodeB = new SourceNode(instanceSourceId('b', NumberType), time, 3);

      const node = new StreamNode(
          staticStreamId('id', NumberType),
          Time.new(),
          (a, b) => a * b,
          ImmutableList.of([sourceNodeA, sourceNodeB]));

      assert(node.getValue(new BaseDisposable(), time)).to.be(6);
    });
  });
});
