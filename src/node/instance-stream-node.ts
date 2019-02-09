import { $pipe, $map, ImmutableList } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { Observable } from 'rxjs';
import { Provider } from '../component/provider';
import { InstanceNode } from './instance-node';

interface AnyNode {
  getObs(context?: BaseDisposable): any;
}

/**
 * Stream node associated with an instance.
 */
export class InstanceStreamNode<T> implements InstanceNode<T> {
  private readonly observables_: WeakMap<BaseDisposable, Observable<T>> = new WeakMap();

  constructor(
      private readonly dependencies_: ImmutableList<AnyNode>,
      private readonly provider_: Provider<T, BaseDisposable>,
  ) { }

  getObs(context: BaseDisposable): Observable<T> {
    const obs = this.observables_.get(context) || null;
    if (obs) {
      return obs;
    }

    const dependenciesObs = $pipe(this.dependencies_, $map(subject => {
      return subject.getObs(context);
    }));

    const newObservable = typeSafeCall(this.provider_, context, ...dependenciesObs());
    this.observables_.set(context, newObservable);

    return newObservable;
  }
}

function typeSafeCall<T, R, A extends Array<unknown>>(
    fn: (this: T, ...args: A) => R,
    context: T,
    // tslint:disable-next-line:trailing-comma
    ...args: A
): R {
  return fn.call(context, ...args);
}

