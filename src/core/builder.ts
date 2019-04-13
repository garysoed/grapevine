import { Observable, ReplaySubject, Subject } from 'rxjs';

import { DelayedObservable } from './delayed_observable';
import { DelayedSubject } from './delayed_subject';
import { Factory } from './factory';
import { Provider } from './provider';
import { Source } from './source';
import { Stream } from './stream';
import { Vine } from './vine';

export class Builder {
  build(appName: string): Vine {
    return new Vine(appName);
  }

  /**
   * Creates an observable that waits for vine to be injected before emitting.
   */
  createObservable<T>(stream: Stream<T, any>): Observable<T> {
    return new DelayedObservable(stream);
  }

  createSource<T>(factory: Factory<T>): Source<T> {
    return new Source(factory);
  }

  createStream<T>(provider: Provider<T, typeof globalThis>): Stream<T, typeof globalThis>;
  createStream<T, C>(provider: Provider<T, C>, context: C): Stream<T, C>;
  createStream<T>(provider: Provider<T, any>, context: any = globalThis): Stream<T, any> {
    return new Stream(provider, context);
  }

  /**
   * Creates a subject that waits for vine to be injected before emitting.
   */
  createSubject<T>(source: Source<T>): DelayedSubject<T> {
    return new DelayedSubject(source);
  }
}
