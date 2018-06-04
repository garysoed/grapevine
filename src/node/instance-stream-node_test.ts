import { assert, should } from 'gs-testing/export/main';
import { ImmutableList } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { instanceStreamId } from '../component/instance-stream-id';
import { staticSourceId } from '../component/static-source-id';
import { Time } from '../component/time';
import { InstanceSourceNode } from './instance-source-node';
import { InstanceStreamNode } from './instance-stream-node';
import { StaticSourceNode } from './static-source-node';

describe('node.InstanceStreamNode', () => {
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
      const idA = instanceStreamId('a', NumberType);
      const idB = instanceStreamId('b', NumberType);
      const idC = staticSourceId('c', NumberType);
      const idD = instanceSourceId('d', NumberType);
      const idE = instanceSourceId('e', NumberType);

      const nodeC = new StaticSourceNode(idC, time, 1);
      const nodeD = new InstanceSourceNode(idD, time, 2);
      const nodeE = new InstanceSourceNode(idE, time, 3);
      const nodeB = new InstanceStreamNode(
          idB,
          time,
          (c, d) => c * d,
          ImmutableList.of([nodeC, nodeD]));
      const nodeA = new InstanceStreamNode(
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
      const sourceNodeA = new InstanceSourceNode(instanceSourceId('a', NumberType), time, 2);
      const sourceNodeB = new InstanceSourceNode(instanceSourceId('b', NumberType), time, 3);

      const node = new InstanceStreamNode(
          instanceStreamId('id', NumberType),
          Time.new(),
          (a, b) => a * b,
          ImmutableList.of([sourceNodeA, sourceNodeB]));

      assert(await node.getValue(new BaseDisposable(), time)).to.be(6);
    });

    should(`handle promises correctly`, async () => {
      const time = Time.new();
      const sourceNodeA = new InstanceSourceNode(instanceSourceId('a', NumberType), time, 2);
      const sourceNodeB = new InstanceSourceNode(instanceSourceId('b', NumberType), time, 3);

      const node = new InstanceStreamNode(
          instanceStreamId('id', NumberType),
          Time.new(),
          async (a, b) => a * b,
          ImmutableList.of([sourceNodeA, sourceNodeB]));

      assert(await node.getValue(new BaseDisposable(), time)).to.be(6);
    });
  });
});
