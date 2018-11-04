import { BaseDisposable } from 'gs-tools/export/dispose';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { InstanceNode } from './instance-node';
import { InstanceSourceProvider } from './instance-source-provider';

export class InstanceSourceNode<T> implements InstanceNode<T> {
  private readonly subjects_: WeakMap<BaseDisposable, BehaviorSubject<T>> = new WeakMap();

  constructor(
      private readonly initializer: InstanceSourceProvider<T>,
  ) { }

  getObs(context: BaseDisposable): Observable<T> {
    return this.getOrCreateObs_(context).pipe(
        distinctUntilChanged(),
        shareReplay(1),
    );
  }

  private getOrCreateObs_(context: BaseDisposable): BehaviorSubject<T> {
    const subject = this.subjects_.get(context) || null;
    if (subject) {
      return subject;
    }

    const newSubject = new BehaviorSubject(this.initializer(context));
    this.subjects_.set(context, newSubject);

    return newSubject;
  }

  next(context: BaseDisposable, value: T): void {
    this.getOrCreateObs_(context).next(value);
  }
}
