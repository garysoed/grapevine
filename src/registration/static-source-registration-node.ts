import { SourceId } from '../component/source-id';
import { Time } from '../component/time';
import { StaticSourceProvider } from '../node/static-source-provider';
import { RegistrationNode } from './registration-node';

/**
 * Represents a registration for a SourceNode.
 */
export class StaticSourceRegistrationNode<T> extends RegistrationNode<T> {
  constructor(
      initTime: Time,
      id: SourceId<T>,
      private readonly initProvider_: StaticSourceProvider<T>) {
    super(initTime, id);
  }

  getInitProvider(): StaticSourceProvider<T> {
    return this.initProvider_;
  }
}
