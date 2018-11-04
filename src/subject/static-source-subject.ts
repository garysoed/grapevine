import { cache } from 'gs-tools/export/data';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, shareReplay, tap } from 'rxjs/operators';
import { StaticSourceProvider } from './static-source-provider';
import { StaticSubject } from './static-subject';

export class StaticSourceSubject<T> implements StaticSubject<T> {

  constructor(private readonly initializer: StaticSourceProvider<T>) {
  }

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
