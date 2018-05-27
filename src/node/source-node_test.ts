import { assert, should } from 'gs-testing/export/main';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { NumberType } from 'gs-types/export';
import { instanceSourceId } from '../component/instance-source-id';
import { Time } from '../component/time';
import { SourceNode } from './source-node';

describe('node.SourceNode', () => {
  const ID = instanceSourceId('id', NumberType);
  const VALUE = 123;
  const TIME = Time.new();
  let node: SourceNode<number>;

  beforeEach(() => {
    node = new SourceNode(ID, TIME, VALUE);
  });

  describe('getSources', () => {
    should(`return the current node`, () => {
      assert(node.getSources()).to.haveElements([node]);
    });
  });

  describe('listen', () => {
    should(`call the handler when the value changes`, () => {
      const mockListener = jasmine.createSpy('Listener');
      const context = new BaseDisposable();
      const newValue = 456;
      const unlisten = node.listen(mockListener, context);
      node.setValue(newValue, context, TIME.increment());

      assert(mockListener).to.haveBeenCalledWith(newValue);

      unlisten();
      mockListener.calls.reset();

      node.setValue(789, context, TIME.increment().increment());
      assert(mockListener).toNot.haveBeenCalled();
    });

    should(`not call the handler if the value change is for another context`, () => {
      const mockListener = jasmine.createSpy('Listener');
      const context = new BaseDisposable();

      node.listen(mockListener, context);
      node.setValue(456, new BaseDisposable(), TIME.increment());

      assert(mockListener).toNot.haveBeenCalled();
    });
  });
});
