import { ImmutableList } from 'gs-tools/export/collect';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { StaticNode } from './static-node';

export class StaticStreamNode<T> implements StaticNode<T> {
  private readonly obs_: Observable<T>;

  constructor(
      dependencies: ImmutableList<StaticNode<any>>,
      provider: (...args: any[]) => T,
  ) {
    this.obs_ = createObs(dependencies, provider);
  }

  getObs(): Observable<T> {
    return this.obs_;
  }
}

function createObs<T>(
    dependencies: ImmutableList<StaticNode<any>>,
    provider: (...args: any[]) => T,
): Observable<T> {
  if (provider.length <= 0) {
    return observableOf(provider());
  }

  return combineLatest([...dependencies.map(subject => subject.getObs())])
      .pipe(
          map(args => provider(...args)),
          shareReplay(1));
}
