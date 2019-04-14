import { Factory } from './factory';
import { Provider } from './provider';
import { Source } from './source';
import { Stream } from './stream';
import { Vine } from './vine';

export class Builder {
  build(appName: string): Vine {
    return new Vine(appName);
  }

  source<T, C>(factory: Factory<T, C>): Source<T, C> {
    return new Source(factory);
  }

  stream<T, C>(provider: Provider<T, C>): Stream <T, C> {
    return new Stream(provider);
  }
}
