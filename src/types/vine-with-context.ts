import { Vine } from '../core/vine';

export interface VineWithContext<C> {
  context: C;
  vine: Vine;
}
