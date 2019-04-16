import { Observable, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { __inject, Injectable } from '../types/injectable';
import { Stream } from './stream';
import { Vine } from './vine';

export class DelayedObservable<T> extends Observable<T> implements Injectable {
  private readonly vineSubject: ReplaySubject<Vine>;

  constructor(stream: Stream<T, any>) {
    const vineSubject = new ReplaySubject<Vine>(1);

    super(subscriber => vineSubject
        .pipe(
            switchMap(vine => stream.get(vine)),
        )
        .subscribe(subscriber),
    );

    this.vineSubject = vineSubject;
  }

  [__inject](vine: Vine): void {
    this.vineSubject.next(vine);
  }
}
