import { InstanceSourceProvider } from '../node/instance-source-provider';
import { RegistrationNode } from './registration-node';

/**
 * Represents a registration for a SourceNode.
 */
export interface InstanceSourceRegistrationNode<T> extends RegistrationNode<T> {
  initProvider: InstanceSourceProvider<T>;
}
