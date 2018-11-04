import { NodeId } from '../component/node-id';
import { Time } from '../component/time';

/**
 * Represents registration for a node.
 */
export interface RegistrationNode<T> {
  readonly id: NodeId<T>;
}
