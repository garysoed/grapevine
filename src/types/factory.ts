import { Subject } from '@rxjs';

import { Vine } from '../core/vine';

export type Factory<T, C> = (this: C, vine: Vine) => Subject<T>;
