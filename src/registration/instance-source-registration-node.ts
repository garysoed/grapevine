import { SourceId } from '../component/source-id';
import { Time } from '../component/time';
import { InstanceSourceProvider } from '../node/instance-source-provider';
import { RegistrationNode } from './registration-node';

/**
 * Represents a registration for a SourceNode.
 */
export class InstanceSourceRegistrationNode<T> extends RegistrationNode<T> {
  constructor(
      initTime: Time,
      id: SourceId<T>,
      private readonly initProvider_: InstanceSourceProvider<T>) {
    super(initTime, id);
  }

  getInitProvider(): InstanceSourceProvider<T> {
    return this.initProvider_;
  }
}
