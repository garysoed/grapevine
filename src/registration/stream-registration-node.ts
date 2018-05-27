import { ImmutableList } from 'gs-tools/export/collect';
import { NodeId } from '../component/node-id';
import { Provider } from '../component/provider';
import { StreamId } from '../component/stream-id';
import { Time } from '../component/time';
import { RegistrationNode } from './registration-node';

/**
 * Represents registration for a StreamNode.
 */
export class StreamRegistrationNode<T> extends RegistrationNode<T> {
  private readonly dependencies_: ImmutableList<NodeId<any>>;

  constructor(
      initTime: Time,
      id: StreamId<T>,
      private readonly providerFn_: Provider<T>,
      dependencies: NodeId<any>[] = []) {
    super(initTime, id);
    this.dependencies_ = ImmutableList.of(dependencies);
  }

  getDependencies(): ImmutableList<NodeId<any>> {
    return this.dependencies_;
  }

  getProvider(): Provider<T> {
    return this.providerFn_;
  }
}
