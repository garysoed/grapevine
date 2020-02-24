import { Subject } from 'rxjs';

import { Factory } from '../types/factory';

import { Vine } from './vine';

class Source<T, C> {
  private readonly subjects: Map<Vine, Subject<T>> = new Map();

  constructor(
      private readonly factory: Factory<T, C>,
      private readonly context: C,
  ) { }

  get(vine: Vine): Subject<T> {
    const sbj = this.subjects.get(vine) || this.factory.call(this.context, vine);
    this.subjects.set(vine, sbj);

    return sbj;
  }
}

export function source<T, C>(factory: Factory<T, C>, context: C): Source<T, C> {
  return new Source(factory, context);
}

export type { Source };
