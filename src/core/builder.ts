import { source, Source } from './source';
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

  vine(): Source<Vine> {
    return source('vine', vine => vine);
  }
}
