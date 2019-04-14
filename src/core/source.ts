import { Subject } from 'rxjs';
import { DelayedSubject } from './delayed-subject';
import { Factory } from './factory';
import { Vine } from './vine';

type GlobalThis = typeof globalThis;

export class Source<T, C> {
  private readonly subjects: Map<Vine, Map<C|GlobalThis, Subject<T>>> = new Map();

  constructor(private readonly factory: Factory<T, C>) { }

  asSubject(): DelayedSubject<T, C> {
    return new DelayedSubject(this);
  }

  get(vine: Vine, context: C): Subject<T> {
    const contextMap = this.subjects.get(vine) || new Map<C, Subject<T>>();
    const sbj = contextMap.get(context) ||
        contextMap.get(globalThis) ||
        this.factory.call(context, vine);
    contextMap.set(context, sbj);
    this.subjects.set(vine, contextMap);

    return sbj;
  }
}
