import { Observable } from 'rxjs';

export interface StaticSubject<T> {
  getObs(): Observable<T>;
}
