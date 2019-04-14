import { Observable, ReplaySubject } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Stream } from './stream';
import { Vine } from './vine';
import { VineWithContext } from './vine-with-context';

export class DelayedObservable<T, C> extends Observable<T> {
  private readonly vineSubject: ReplaySubject<VineWithContext<C>>;

  constructor(stream: Stream<T, C>) {
    const vineSubject = new ReplaySubject<VineWithContext<C>>(1);

    super(subscriber => vineSubject
        .pipe(
            switchMap(({context, vine}) => stream.get(vine, context)),
        )
        .subscribe(subscriber),
    );

    this.vineSubject = vineSubject;
  }

  setContext(vine: Vine, context: C): void {
    this.vineSubject.next({vine, context});
  }
}
