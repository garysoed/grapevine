import { assert, should, test } from 'gs-testing/export/main';
import { ImmutableList } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { BehaviorSubject } from 'rxjs';
import { InstanceSourceNode } from './instance-source-node';
import { InstanceStreamNode } from './instance-stream-node';

/**
 * @test
 */
class TestClass extends BaseDisposable {
  private readonly factor_: number = 2;

  fnNoInput(): number {
    return this.factor_;
  }

  fnWithInput(input: number): number {
    return input * this.factor_;
  }
}

test('node.InstanceStreamNode', () => {
  test('getObs', () => {
    should(`return the correct observable`, () => {
      const context = new TestClass();
      const sourceNode = new InstanceSourceNode(() => 3);
      const node = new InstanceStreamNode(
          ImmutableList.of([sourceNode]),
          context.fnWithInput,
      );

      const subject = new BehaviorSubject<number|null>(null);
      node.getObs(context).subscribe(subject);
      assert(subject.getValue()).to.equal(6);

      sourceNode.next(context, 5);
      assert(subject.getValue()).to.equal(10);
    });

    should(`work with provides with no input`, () => {
      const context = new TestClass();
      const node = new InstanceStreamNode(
          ImmutableList.of([]),
          context.fnNoInput,
      );

      const subject = new BehaviorSubject<number|null>(null);
      node.getObs(context).subscribe(subject);
      assert(subject.getValue()).to.equal(2);
    });

    should(`reuse existing observable`, () => {
      const context = new TestClass();
      const sourceNode = new InstanceSourceNode(() => 3);
      const node = new InstanceStreamNode(
          ImmutableList.of([sourceNode]),
          context.fnWithInput,
      );

      const subject1 = new BehaviorSubject<number|null>(null);
      node.getObs(context).subscribe(subject1);

      const subject2 = new BehaviorSubject<number|null>(null);
      node.getObs(context).subscribe(subject2);

      sourceNode.next(context, 5);
      assert(subject1.getValue()).to.equal(10);
      assert(subject2.getValue()).to.equal(10);
    });
  });
});
