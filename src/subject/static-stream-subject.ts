import { ImmutableList } from 'gs-tools/export/collect';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { StaticSubject } from './static-subject';

export class StaticStreamSubject<T> implements StaticSubject<T> {
  private readonly obs_: Observable<T>;

  constructor(
      dependencies: ImmutableList<StaticSubject<any>>,
      provider: (...args: any[]) => T,
  ) {
    this.obs_ = createObs(dependencies, provider);
  }

  getObs(): Observable<T> {
    return this.obs_;
  }
}

function createObs<T>(
    dependencies: ImmutableList<StaticSubject<any>>,
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
