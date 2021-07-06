import {assert, should, test} from 'gs-testing';

import {source} from '../core/source';

import {Vine} from './vine';


const GLOBAL_SOURCE = source(() => 1);
const GLOBAL_STREAM = source(vine => GLOBAL_SOURCE.get(vine) * 2);

class TestWrapper { }
const WRAPPER_SOURCE = source(() => new TestWrapper());

test('@grapevine/core/functional', () => {
  class TestClass {
    private readonly instanceSource = source(() => 2);
    private readonly instanceStream = source(vine => this.stream(vine));

    constructor(private readonly pad: number) { }

    getValue(vine: Vine): string {
      const instanceSource = this.instanceSource.get(vine);
      const instanceStream = this.instanceStream.get(vine);
      const globalSource = GLOBAL_SOURCE.get(vine);
      const globalStream = GLOBAL_STREAM.get(vine);
      return [
        instanceSource * this.pad,
        instanceStream,
        globalSource * this.pad,
        globalStream,
      ].join(' ');
    }

    // tslint:disable-next-line: prefer-function-over-method
    private stream(vine: Vine): number {
      return this.instanceSource.get(vine) * 3;
    }
  }

  should('provide the correct values for non injected class', () => {
    const vine1 = new Vine({appName: 'test1'});
    const vine2 = new Vine({appName: 'test2'});
    const test1 = new TestClass(1);
    const test2 = new TestClass(2);

    const value11 = test1.getValue(vine1);
    const value21 = test2.getValue(vine1);

    assert(value11).to.equal('2 6 1 2');
    assert(value21).to.equal('4 6 2 2');

    const value12 = test1.getValue(vine2);
    const value22 = test2.getValue(vine2);
    assert(value12).to.equal('2 6 1 2');
    assert(value22).to.equal('4 6 2 2');
  });

  should('provide the same instance with multiple subscriptions to streams and if the dependency emits', () => {
    const vine = new Vine({appName: 'test'});

    assert(WRAPPER_SOURCE.get(vine)).to.equal(WRAPPER_SOURCE.get(vine));
  });
});
