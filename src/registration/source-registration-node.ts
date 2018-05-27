import { SourceId } from '../component/source-id';
import { Time } from '../component/time';
import { RegistrationNode } from './registration-node';

/**
 * Represents a registration for a SourceNode.
 */
export class SourceRegistrationNode<T> extends RegistrationNode<T> {
  constructor(
      initTime: Time,
      id: SourceId<T>,
      private readonly initValue_: T) {
    super(initTime, id);
  }

  getInitValue(): T {
    return this.initValue_;
  }
}
