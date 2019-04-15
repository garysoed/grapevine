import { assert, setup, should, test } from '@gs-testing';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { Builder } from './builder';
import { DelayedSubject } from './delayed-subject';

test('grapevine/core/delayed-subject', () => {
  let builder: Builder;
  let subject: DelayedSubject<number>;

  setup(() => {
    builder = new Builder();
    const source = builder.source(() => new BehaviorSubject(1), globalThis);
    subject = source.asSubject();
  });

  should(`only emit the value after vine is set`, async () => {
    const replaySubject = new ReplaySubject(2);
    subject.subscribe(replaySubject);

    await assert(replaySubject).toNot.emit();

    const vine = builder.build('test');
    subject.setContext(vine);

    const value = 123;
    subject.next(value);

    await assert(replaySubject).to.emitSequence([1, value]);
  });
});
