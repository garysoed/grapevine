import { $map, ImmutableList, $exec } from 'gs-tools/export/collect';
import { Observable } from 'rxjs';
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

  return provider(...$exec(dependencies, $map(subject => subject.getObs()))());
}
