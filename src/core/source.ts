import { Subject } from 'rxjs';
import { Factory } from './factory';
import { Vine } from './vine';

export class Source<T> {
  private readonly subjects: Map<Vine, Subject<T>> = new Map();

  constructor(private readonly factory: Factory<T>) { }

  get(vine: Vine): Subject<T> {
    const subject = this.subjects.get(vine) || this.factory();
    this.subjects.set(vine, subject);

    return subject;
  }
}
