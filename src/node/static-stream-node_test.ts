import { assert, should } from 'gs-testing/export/main';
import { ImmutableList } from 'gs-tools/export/collect';
import { BehaviorSubject } from 'rxjs';
import { StaticSourceNode } from './static-source-node';
import { StaticStreamNode } from './static-stream-node';

describe('node.StaticStreamNode', () => {
  describe('getObs', () => {
    should(`return the correct observable`, () => {
      const sourceNode = new StaticSourceNode(() => 3);
      const node = new StaticStreamNode(
          ImmutableList.of([sourceNode]),
          input => input * 2,
      );

      const subject = new BehaviorSubject<number|null>(null);
      node.getObs().subscribe(subject);
      assert(subject.getValue()).to.equal(6);

      sourceNode.next(5);
      assert(subject.getValue()).to.equal(10);
    });

    should(`work with provides with no input`, () => {
      const node = new StaticStreamNode(
          ImmutableList.of([]),
          () => 2,
      );

      const subject = new BehaviorSubject<number|null>(null);
      node.getObs().subscribe(subject);
      assert(subject.getValue()).to.equal(2);
    });

    should(`reuse existing observable`, () => {
      const sourceNode = new StaticSourceNode(() => 3);
      const node = new StaticStreamNode(
          ImmutableList.of([sourceNode]),
          input => input * 2,
      );

      const subject1 = new BehaviorSubject<number|null>(null);
      node.getObs().subscribe(subject1);

      const subject2 = new BehaviorSubject<number|null>(null);
      node.getObs().subscribe(subject2);

      sourceNode.next(5);
      assert(subject1.getValue()).to.equal(10);
      assert(subject2.getValue()).to.equal(10);
    });
  });
});
