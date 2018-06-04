import { ImmutableList, ImmutableSet } from 'gs-tools/export/collect';
import { cache } from 'gs-tools/export/data';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { InstanceStreamId } from '../component/instance-stream-id';
import { Provider } from '../component/provider';
import { Time } from '../component/time';
import { InstanceNode } from './instance-node';
import { SourceNode } from './source-node';
import { StaticNode } from './static-node';

type AnyNode<T> = InstanceNode<T>|StaticNode<T>;

/**
 * Stream nodes that are bound to specific instances.
 */
export class InstanceStreamNode<T> extends InstanceNode<T> {
  constructor(
      id: InstanceStreamId<T>,
      initTime: Time,
      private readonly fn_: Provider<T>,
      private readonly dependencies_: ImmutableList<AnyNode<any>> = ImmutableList.of()) {
    super(initTime, id);
  }

  protected async computeValue_(context: BaseDisposable, time: Time): Promise<T> {
    const args = this.dependencies_.map(dependency => {
      if (dependency instanceof InstanceNode) {
        return dependency.getValue(context, time);
      } else {
        return dependency.getValue(time);
      }
    });

    return this.fn_.apply(context, await Promise.all([...args]));
  }

  @cache()
  getSources(): ImmutableSet<SourceNode<any>> {
    const sourcesSet = new Set();
    for (const dependency of this.dependencies_) {
      for (const source of dependency.getSources()) {
        sourcesSet.add(source);
      }
    }

    return ImmutableSet.of(sourcesSet);
  }
}
