import { ImmutableList, ImmutableSet } from 'gs-tools/export/collect';
import { cache } from 'gs-tools/export/data';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { Provider } from '../component/provider';
import { StreamId } from '../component/stream-id';
import { Time } from '../component/time';
import { SourceNode } from './source-node';
import { VineNode } from './vine-node';

/**
 * Node with dependencies. These nodes are read only. To change the value of this node, you must
 * change the value of its dependencies.
 */
export class StreamNode<T> extends VineNode<T> {
  constructor(
      id: StreamId<T>,
      initTime: Time,
      private readonly fn_: Provider<T>,
      private readonly dependencies_: ImmutableList<VineNode<any>> = ImmutableList.of()) {
    super(initTime, id);
  }

  protected computeValue_(context: BaseDisposable, time: Time): T {
    // TODO: Promises.
    const args = this.dependencies_.map(dependency => dependency.getValue(context, time));

    return this.fn_.apply(context, [...args]);
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
