import { BaseDisposable } from '@gs-tools/dispose';
import { Observable } from 'rxjs';

/**
 * Nodes that are associated with an instance.
 */
export interface InstanceNode<T> {
  getObs(context: BaseDisposable): Observable<T>;
}
