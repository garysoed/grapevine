import { assert, should, test } from 'gs-testing';
import { BehaviorSubject, of as observableOf } from 'rxjs';

import { Builder } from './builder';
import { injectVine } from './inject-vine';

test('@grapevine/core/inject-vine', () => {
  should(`inject the delayed observables and subjects correctly`, async () => {
    const builder = new Builder();

    class TestClass {
      readonly observable = builder.stream(() => observableOf(3), globalThis).asObservable();
      readonly skipped = 5;
      readonly subject = builder.source(() => new BehaviorSubject(1), globalThis).asSubject();
    }

    const instance = new TestClass();
    const vine = builder.build('test');

    assert(instance.subject).toNot.emit();
    assert(instance.observable).toNot.emit();
    assert(instance.skipped).to.equal(5);

    injectVine(vine, instance);

    assert(instance.subject).to.emitWith(1);
    assert(instance.observable).to.emitWith(3);
    assert(instance.skipped).to.equal(5);
  });
});
