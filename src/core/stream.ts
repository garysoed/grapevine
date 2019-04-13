import { Observable } from 'rxjs';
import { Provider } from './provider';
import { Vine } from './vine';

export class Stream<T, C> {
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
