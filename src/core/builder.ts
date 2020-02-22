import { of as observableOf } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { Factory } from '../types/factory';
import { Provider } from '../types/provider';

import { Source } from './source';
import { Stream } from './stream';
import { Vine } from './vine';

type InitFn = (vine: Vine) => unknown;

export class Builder {
  private readonly onRunFns: InitFn[] = [];

  build(appName: string): Vine {
    const vine = new Vine(appName);
    for (const fn of this.onRunFns) {
      fn(vine);
    }

    return vine;
  }

  onRun(initFn: InitFn): void {
    this.onRunFns.push(initFn);
  }

  source<T, C>(factory: Factory<T, C>, context: C): Source<T, C> {
    return new Source(factory, context);
  }

  stream<T, C>(provider: Provider<T, C>, context: C): Stream<T, C> {
    return new Stream(provider, context);
  }

  vine(): Stream<Vine, typeof globalThis> {
    return new Stream(vine => observableOf(vine).pipe(shareReplay(1)), globalThis);
  }
}
