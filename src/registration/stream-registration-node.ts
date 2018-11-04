import { ImmutableList } from 'gs-tools/export/collect';
import { NodeId } from '../component/node-id';
import { Provider } from '../component/provider';
import { RegistrationNode } from './registration-node';

/**
 * Represents registration for a StreamNode.
 */
export interface StreamRegistrationNode<T> extends RegistrationNode<T> {
  readonly dependencies: ImmutableList<NodeId<any>>;
  readonly providerFn: Provider<T>;
}
