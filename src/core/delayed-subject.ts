import { filterNonNull, mapNonNull } from '@gs-tools/rxjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { shareReplay, switchMap, take } from 'rxjs/operators';
import { __inject, Injectable } from '../types/injectable';
import { Source } from './source';
import { Vine } from './vine';

export class DelayedSubject<T> extends Observable<T> implements Injectable {
  private readonly subjectObs: Observable<Subject<T>|null>;
  private readonly vineSubject: BehaviorSubject<Vine|null>;

  constructor(source: Source<T, any>) {
    const vineSubject = new BehaviorSubject<Vine|null>(null);
    const subjectObs = vineSubject
        .pipe(
            mapNonNull(vine => source.get(vine)),
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

  [__inject](vine: Vine): void {
    this.vineSubject.next(vine);
  }

  next(value?: T): void {
    this.subjectObs
        .pipe(
            take(1),
            filterNonNull(),
        )
        .subscribe(subject => subject.next(value));
  }
}
