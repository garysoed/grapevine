import { Vine } from './vine';

export interface VineWithContext<C> {
  context: C;
  vine: Vine;
}
