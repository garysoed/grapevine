import { Observable } from 'rxjs';

export interface StaticNode<T> {
  getObs(): Observable<T>;
}
