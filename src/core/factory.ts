import { Subject } from 'rxjs';
import { Vine } from './vine';

export type Factory<T, C> = (this: C, vine: Vine) => Subject<T>;
