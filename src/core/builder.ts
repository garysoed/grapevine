import { Factory } from './factory';
import { Provider } from './provider';
import { Source } from './source';
import { Stream } from './stream';
import { Vine } from './vine';

export class Builder {
  private readonly sourceCache = new Map<Factory<any, any>, Source<any, any>>();
  private readonly streamCache = new Map<Provider<any, any>, Stream<any, any>>();

  build(appName: string): Vine {
    return new Vine(appName);
  }

  source<T, C>(factory: Factory<T, C>): Source<T, C> {
    const source = this.sourceCache.get(factory) || new Source(factory);
    this.sourceCache.set(factory, source);

    return source;
  }

  stream<T, C>(provider: Provider<T, C>): Stream <T, C> {
    const stream = this.streamCache.get(provider) || new Stream(provider);
    this.streamCache.set(provider, stream);

    return stream;
  }
}
