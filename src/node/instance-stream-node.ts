import { ImmutableList } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { InstanceNode } from './instance-node';

interface AnySubject {
  getObs(context?: BaseDisposable): any;
}

export class InstanceStreamNode<T> implements InstanceNode<T> {
  private readonly observables_: WeakMap<BaseDisposable, Observable<T>> = new WeakMap();

  constructor(
      private readonly dependencies_: ImmutableList<AnySubject>,
      private readonly provider_: (this: BaseDisposable, ...args: any[]) => T,
  ) { }

  getObs(context: BaseDisposable): Observable<T> {
    const obs = this.observables_.get(context) || null;
    if (obs) {
      return obs;
    }

    const dependenciesObs = this.dependencies_.map(subject => {
      return subject.getObs(context);
    });

    let newObservable;
    if (dependenciesObs.size() <= 0) {
      newObservable = observableOf(this.provider_.call(context));
    } else {
      newObservable = combineLatest([...dependenciesObs])
          .pipe(
              map(args => this.provider_.call(context, ...args)),
              shareReplay(1),
          );
    }

    this.observables_.set(context, newObservable);

    return newObservable;
  }
}
