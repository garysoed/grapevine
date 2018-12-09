import { Observable, of as observableOf } from 'rxjs';

export function normalizeObs<T>(fn: () => T|Observable<T>): Observable<T> {
  return new Observable(subscriber => {
    const value = fn();
    const obs = value instanceof Observable ? value : observableOf(value);

    return obs.subscribe(subscriber);
  });
}
