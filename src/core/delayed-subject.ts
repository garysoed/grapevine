import { filterNonNull, mapNonNull } from '@gs-tools/rxjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { shareReplay, switchMap, take } from 'rxjs/operators';
import { Source } from './source';
import { Vine } from './vine';

interface VineWithContext<C> {
  context: C;
  vine: Vine;
}

export class DelayedSubject<T, C> extends Observable<T> {
  private readonly subjectObs: Observable<Subject<T>|null>;
  private readonly vineSubject: BehaviorSubject<VineWithContext<C>|null>;

  constructor(source: Source<T, C>) {
    const vineSubject = new BehaviorSubject<VineWithContext<C>|null>(null);
    const subjectObs = vineSubject
        .pipe(
            mapNonNull(({context, vine}) => source.get(vine, context)),
            shareReplay(1),
        );

    super(subscriber => subjectObs
        .pipe(
            filterNonNull(),
            switchMap(subject => subject),
        )
        .subscribe(subscriber),
    );

    this.subjectObs = subjectObs;
    this.vineSubject = vineSubject;
  }

  next(value?: T): void {
    this.subjectObs
        .pipe(
            take(1),
            filterNonNull(),
        )
        .subscribe(subject => subject.next(value));
  }

  setContext(vine: Vine, context: C): void {
    this.vineSubject.next({vine, context});
  }
}
