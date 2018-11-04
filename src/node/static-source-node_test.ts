import { assert, should } from 'gs-testing/export/main';
import { createSpy, fake, resetCalls, Spy } from 'gs-testing/export/spy';
import { BehaviorSubject } from 'rxjs';
import { StaticSourceNode } from './static-source-node';

describe('node.StaticSourceNode', () => {
  let mockProvider: Spy<number, []>;
  let node: StaticSourceNode<number>;

  beforeEach(() => {
    mockProvider = createSpy('Provider');
    node = new StaticSourceNode(mockProvider);
  });

  describe('getObs', () => {
    should(`return the correct observable`, () => {
      const value = 123;
      fake(mockProvider).always().return(value);

      const subject = new BehaviorSubject<number|null>(null);
      node.getObs().subscribe(subject);
      assert(subject.getValue()).to.equal(value);
      assert(mockProvider).to.haveBeenCalledWith();
    });

    should(`return the existing observable if there is one`, () => {
      fake(mockProvider).always().return(123);

      const subject1 = new BehaviorSubject<number|null>(null);
      node.getObs().subscribe(subject1);

      const subject2 = new BehaviorSubject<number|null>(null);
      node.getObs().subscribe(subject2);

      const newValue = 234;
      node.next(newValue);
      assert(subject1.getValue()).to.equal(newValue);
      assert(subject2.getValue()).to.equal(newValue);
    });

    should(`not emit if the new value is the same`, () => {
      const value = 123;
      fake(mockProvider).always().return(value);

      const mockHandler = createSpy('Handler');
      node.getObs().subscribe(mockHandler);

      resetCalls(mockHandler);
      node.next(value);
      assert(mockHandler).toNot.haveBeenCalled();
    });
  });

  describe('next', () => {
    should(`update the value`, () => {
      const value = 123;
      fake(mockProvider).always().return(value);

      const subject1 = new BehaviorSubject<number|null>(null);
      node.getObs().subscribe(subject1);

      const newValue = 234;
      node.next(newValue);
      assert(subject1.getValue()).to.equal(newValue);
    });
  });
});
