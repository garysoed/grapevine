import { Observable } from 'rxjs';

import { Vine } from '../core/vine';

export type Provider<T> = (vine: Vine) => Observable<T>;
