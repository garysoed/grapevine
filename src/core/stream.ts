import { Observable } from 'rxjs';
import { DelayedObservable } from './delayed-observable';
import { Provider } from './provider';
import { Vine } from './vine';

type GlobalThis = typeof globalThis;

export class Stream<T, C> {
  private readonly observables: Map<Vine, Map<C|GlobalThis, Observable<T>>> = new Map();

  constructor(
      private readonly provider: Provider<T, C>,
  ) { }

  asObservable(): DelayedObservable<T, C> {
    return new DelayedObservable(this);
  }

  get(vine: Vine, context: C): Observable<T> {
    const contextMap = this.observables.get(vine) || new Map<C, Observable<T>>();
    const obs = contextMap.get(context) ||
        contextMap.get(globalThis) ||
        this.provider.call(context, vine);
    contextMap.set(context, obs);
    this.observables.set(vine, contextMap);

    return obs;
  }
}
