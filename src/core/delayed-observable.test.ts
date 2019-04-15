import { assert, should, test } from '@gs-testing';
import { of as observableOf, ReplaySubject } from 'rxjs';
import { Builder } from './builder';
import { DelayedObservable } from './delayed-observable';

test('grapevine/core/delayed-observable', () => {
  should(`not emit until vine is given`, async () => {
    const value = 123;
    const builder = new Builder();
    const stream = builder.stream(() => observableOf(value), globalThis);

    const obs = new DelayedObservable(stream);
    const subject = new ReplaySubject(1);
    obs.subscribe(subject);

    await assert(subject).toNot.emit();

    const vine = builder.build('test');
    obs.setContext(vine);

    await assert(subject).to.emitWith(value);
  });
});
