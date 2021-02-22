import {BehaviorSubject, Observable} from 'rxjs';

import {Id, __unused} from './id';
import {Vine, __getOrInit} from './vine';


export class SubjectSource<T> implements Id<Observable<T>> {
  readonly [__unused]: {};
  readonly provider =
      (vine: Vine): BehaviorSubject<T> => new BehaviorSubject(this.providerInternal(vine));

  constructor(
      readonly key: string,
      private readonly providerInternal: (vine: Vine) => T,
  ) { }

  get(vine: Vine): Observable<T> {
    return vine[__getOrInit](this, this.provider);
  }

  set(vine: Vine, modifierFn: (oldValue: T) => T): void {
    const subject: BehaviorSubject<T> = vine[__getOrInit](this, this.provider);
    subject.next(modifierFn(subject.getValue()));
  }
}

export function subjectSource<T>(
    key: string,
    valueProvider: (vine: Vine) => T,
): SubjectSource<T> {
  return new SubjectSource(key, valueProvider);
}
