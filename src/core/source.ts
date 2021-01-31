import {debug} from 'gs-tools/export/rxjs';
import {BehaviorSubject, Observable} from 'rxjs';
import {Logger} from 'santa';

import {Vine} from './vine';


const LOGGER = new Logger('grapevine');

class Source<T> {
  private readonly subjects: Map<Vine, BehaviorSubject<T>> = new Map();

  constructor(
      private readonly key: string,
      private readonly initValueProvider: (vine: Vine) => T,
  ) { }

  get(vine: Vine): Observable<T> {
    return this.get_(vine).pipe(debug(LOGGER, 'source', this.key));
  }

  set(vine: Vine, mutator: (currentValue: T) => T): void {
    const value$ = this.get_(vine);
    value$.next(mutator(value$.getValue()));
  }

  private get_(vine: Vine): BehaviorSubject<T> {
    const sbj = this.subjects.get(vine) || new BehaviorSubject(this.initValueProvider(vine));
    this.subjects.set(vine, sbj);

    return sbj;
  }
}

export function source<T>(
    key: string,
    valueProvider: (vine: Vine) => T,
): Source<T> {
  return new Source(key, valueProvider);
}

export type {Source};

