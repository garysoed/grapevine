import { Observable } from 'rxjs';

/**
 * Nodes that are not associated with any instances.
 */
export interface StaticNode<T> {
  getObs(): Observable<T>;
}
