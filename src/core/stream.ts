import { debug } from 'gs-tools/export/rxjs';
import { Verbosity } from 'moirai';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { Logger } from 'santa';

import { Provider } from '../types/provider';

import { Vine } from './vine';


const LOGGER = new Logger('grapevine');

class Stream<T> {
  private readonly observables: Map<Vine, Observable<T>> = new Map();

  constructor(
      private readonly provider: Provider<T>,
  ) { }

  get(vine: Vine): Observable<T> {
    const obs = this.observables.get(vine) || this.provider(vine);
    this.observables.set(vine, obs);

    return obs;
  }
}

export function stream<T>(
    key: string,
    provider: Provider<T>,
): Stream<T> {
  return new Stream(
      vine => provider(vine)
          .pipe(
              shareReplay({bufferSize: 1, refCount: false}),
              debug(LOGGER, Verbosity.NONE, 'stream', key),
          ),
  );
}

export type { Stream };

