import { cache } from 'gs-tools/export/data';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { StaticNode } from './static-node';
import { StaticSourceProvider } from './static-source-provider';

/**
 * Source node not associated with any instances.
 */
export class StaticSourceNode<T> implements StaticNode<T> {

  constructor(private readonly initializer: StaticSourceProvider<T>) { }

  getObs(): Observable<T> {
    return this.getOrCreateObs().pipe(
        distinctUntilChanged(),
        shareReplay(1),
    );
  }

  @cache()
  private getOrCreateObs(): BehaviorSubject<T> {
    return new BehaviorSubject(this.initializer());
  }

  next(newValue: T): void {
    this.getOrCreateObs().next(newValue);
  }
}
