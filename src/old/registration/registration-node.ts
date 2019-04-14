import { NodeId } from '../component/node-id';

/**
 * Represents registration for a node.
 */
export interface RegistrationNode<T> {
  readonly id: NodeId<T>;
}
