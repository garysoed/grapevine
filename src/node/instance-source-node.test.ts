import { assert, should, test } from 'gs-testing/export/main';
import { createSpy, fake, resetCalls, Spy } from 'gs-testing/export/spy';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { BehaviorSubject } from 'rxjs';
import { InstanceSourceNode } from './instance-source-node';

test('node.InstanceSourceNode', () => {
  let mockProvider: Spy<number, [BaseDisposable]>;
  let node: InstanceSourceNode<number>;

  beforeEach(() => {
    mockProvider = createSpy('Provider');
    node = new InstanceSourceNode(mockProvider);
  });

  test('getObs', () => {
    should(`return the correct observable`, () => {
      const context = new BaseDisposable();
      const value = 123;
      fake(mockProvider).always().return(value);

      const subject = new BehaviorSubject<number|null>(null);
      node.getObs(context).subscribe(subject);
      assert(subject.getValue()).to.equal(value);
      assert(mockProvider).to.haveBeenCalledWith(context);
    });

    should(`return the existing observable if there is one`, () => {
      const context = new BaseDisposable();
      fake(mockProvider).always().return(123);

      const subject1 = new BehaviorSubject<number|null>(null);
      node.getObs(context).subscribe(subject1);

      const subject2 = new BehaviorSubject<number|null>(null);
      node.getObs(context).subscribe(subject2);

      const newValue = 234;
      node.next(context, newValue);
      assert(subject1.getValue()).to.equal(newValue);
      assert(subject2.getValue()).to.equal(newValue);
    });

    should(`not emit if the new value is the same`, () => {
      const context = new BaseDisposable();
      const value = 123;
      fake(mockProvider).always().return(value);

      const mockHandler = createSpy('Handler');
      node.getObs(context).subscribe(mockHandler);

      resetCalls(mockHandler);
      node.next(context, value);
      assert(mockHandler).toNot.haveBeenCalled();
    });
  });

  test('next', () => {
    should(`update the value for the correct context`, () => {
      const context1 = new BaseDisposable();
      const context2 = new BaseDisposable();
      const value = 123;
      fake(mockProvider).always().return(value);

      const subject1 = new BehaviorSubject<number|null>(null);
      node.getObs(context1).subscribe(subject1);

      const newValue = 234;
      node.next(context1, newValue);
      node.next(context2, 345);
      assert(subject1.getValue()).to.equal(newValue);
    });
  });
});
