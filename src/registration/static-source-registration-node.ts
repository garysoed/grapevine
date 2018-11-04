import { StaticSourceProvider } from '../node/static-source-provider';
import { RegistrationNode } from './registration-node';

/**
 * Represents a registration for a SourceNode.
 */
export interface StaticSourceRegistrationNode<T> extends RegistrationNode<T> {
  readonly initProvider: StaticSourceProvider<T>;
}
