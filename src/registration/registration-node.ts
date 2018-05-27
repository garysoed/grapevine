import { NodeId } from '../component/node-id';
import { Time } from '../component/time';

/**
 * Represents registration for a node.
 */
export class RegistrationNode<T> {
  constructor(
      private readonly initTime_: Time,
      private readonly id_: NodeId<T>) { }

  getId(): NodeId<T> {
    return this.id_;
  }

  getInitTime(): Time {
    return this.initTime_;
  }
}
