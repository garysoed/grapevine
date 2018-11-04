import { BaseDisposable } from 'gs-tools/export/dispose';
import { Observable } from 'rxjs';

export interface InstanceNode<T> {
  getObs(context: BaseDisposable): Observable<T>;
}
