import { assert, should } from 'gs-testing/export/main';
import { createSpy, resetCalls } from 'gs-testing/export/spy';
import { NumberType } from 'gs-types/export';
import { staticSourceId } from '../component/static-source-id';
import { Time } from '../component/time';
import { StaticSourceNode } from './static-source-node';

describe('node.StaticSourceNode', () => {
  const ID = staticSourceId('id', NumberType);
  const VALUE = 123;
  const TIME = Time.new();
  let node: StaticSourceNode<number>;

  beforeEach(() => {
    node = new StaticSourceNode(ID, TIME, () => VALUE);
  });

  describe('getSources', () => {
    should(`return the current node`, () => {
      assert(node.getSources()).to.haveElements([node]);
    });
  });

  describe('listen', () => {
    should(`call the handler when the value changes`, () => {
      const mockListener = createSpy('Listener');
      const newValue = 456;
      const unlisten = node.listen(mockListener);
      node.setValue(newValue, TIME.increment());

      assert(mockListener).to.haveBeenCalledWith(newValue);

      unlisten();
      resetCalls(mockListener);

      node.setValue(789, TIME.increment().increment());
      assert(mockListener).toNot.haveBeenCalled();
    });
  });
});
