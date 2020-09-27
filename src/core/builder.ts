import { of as observableOf } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { Stream, stream } from './stream';
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

  vine(): Stream<Vine> {
    return stream('vine', vine => observableOf(vine).pipe(shareReplay(1)));
  }
}
