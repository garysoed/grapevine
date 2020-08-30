import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { Provider } from '../types/provider';

import { Vine } from './vine';

class Stream<T, C> {
  private readonly observables: Map<Vine, Observable<T>> = new Map();

  constructor(
      private readonly provider: Provider<T, C>,
      private readonly context: C,
  ) { }

  get(vine: Vine): Observable<T> {
    const obs = this.observables.get(vine) || this.provider.call(this.context, vine);
    this.observables.set(vine, obs);

    return obs;
  }
}

export function stream<T, C>(provider: Provider<T, C>, context: C): Stream<T, C> {
  return new Stream(
      vine => provider.call(context, vine)
          .pipe(shareReplay({bufferSize: 1, refCount: false})),
      context,
  );
}

export type { Stream };
