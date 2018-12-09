import { ImmutableList } from 'gs-tools/export/collect';
import { combineLatest, Observable } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { Provider } from '../component/provider';
import { normalizeObs } from './normalize-obs';
import { StaticNode } from './static-node';

/**
 * Streaming node not associated with any instances.
 */
export class StaticStreamNode<T> implements StaticNode<T> {
  private readonly obs_: Observable<T>;

  constructor(
      dependencies: ImmutableList<StaticNode<any>>,
      provider: Provider<T>,
  ) {
    this.obs_ = createObs(dependencies, provider);
  }

  getObs(): Observable<T> {
    return this.obs_;
  }
}

function createObs<T>(
    dependencies: ImmutableList<StaticNode<any>>,
    provider: Provider<T>,
): Observable<T> {
  if (provider.length <= 0) {
    return normalizeObs(provider);
  }

  return combineLatest([...dependencies.map(subject => subject.getObs())])
      .pipe(
          switchMap(args => normalizeObs(() => provider(...args))),
          shareReplay(1));
}
