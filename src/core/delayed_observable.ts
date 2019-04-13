import { Observable, ReplaySubject } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Stream } from './stream';
import { Vine } from './vine';

export class DelayedObservable<T> extends Observable<T> {
  private readonly vineSubject: ReplaySubject<Vine>;

  constructor(stream: Stream<T, unknown>) {
    const vineSubject = new ReplaySubject<Vine>(1);

    super(subscriber => vineSubject
        .pipe(
            take(1),
            switchMap(vine => stream.get(vine)),
        )
        .subscribe(subscriber),
    );

    this.vineSubject = vineSubject;
  }

  setVine(vine: Vine): void {
    this.vineSubject.next(vine);
  }
}
