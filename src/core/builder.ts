import { Factory } from '../types/factory';
import { Provider } from '../types/provider';
import { Source } from './source';
import { Stream } from './stream';
import { Vine } from './vine';

export class Builder {
  build(appName: string): Vine {
    return new Vine(appName);
  }

  source<T, C>(factory: Factory<T, C>, context: C): Source<T, C> {
    return new Source(factory, context);
  }

  stream<T, C>(provider: Provider<T, C>, context: C): Stream <T, C> {
    return new Stream(provider, context);
  }
}
