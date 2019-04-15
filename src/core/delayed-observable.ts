import { Observable, ReplaySubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Stream } from './stream';
import { Vine } from './vine';

export class DelayedObservable<T> extends Observable<T> {
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

  setContext(vine: Vine): void {
    this.vineSubject.next(vine);
  }
}
