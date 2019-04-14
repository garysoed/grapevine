import { Observable } from 'rxjs';
import { DelayedObservable } from './delayed-observable';
import { Provider } from './provider';
import { Vine } from './vine';

export class Stream<T, C> {
  private readonly observables: Map<Vine, Observable<T>> = new Map();

  constructor(
      private readonly provider: Provider<T, C>,
  ) { }

  asObservable(): DelayedObservable<T, C> {
    return new DelayedObservable(this);
  }

  get(vine: Vine, context: C): Observable<T> {
    const obs = this.observables.get(vine) || this.provider.call(context, vine);
    this.observables.set(vine, obs);

    return obs;
  }
}
