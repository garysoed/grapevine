import { StaticSourceProvider } from '../subject/static-source-provider';
import { RegistrationNode } from './registration-node';

/**
 * Represents a registration for a SourceNode.
 */
export interface StaticSourceRegistrationNode<T> extends RegistrationNode<T> {
  initProvider: StaticSourceProvider<T>;
}
