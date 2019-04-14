import { Subject } from 'rxjs';
import { Factory } from '../types/factory';
import { DelayedSubject } from './delayed-subject';
import { Vine } from './vine';

export class Source<T, C> {
  private readonly subjects: Map<Vine, Subject<T>> = new Map();

  constructor(private readonly factory: Factory<T, C>) { }

  asSubject(): DelayedSubject<T, C> {
    return new DelayedSubject(this);
  }

  get(vine: Vine, context: C): Subject<T> {
    const sbj = this.subjects.get(vine) || this.factory.call(context, vine);
    this.subjects.set(vine, sbj);

    return sbj;
  }
}
