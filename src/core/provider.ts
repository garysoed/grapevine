import { Observable } from 'rxjs';
import { Vine } from './vine';

export type Provider<T, C> = (this: C, vine: Vine) => Observable<T>;
