import { ImmutableList, ImmutableSet } from 'gs-tools/export/collect';
import { Provider } from '../component/provider';
import { StaticStreamId } from '../component/static-stream-id';
import { Time } from '../component/time';
import { StaticNode } from './static-node';
import { StaticSourceNode } from './static-source-node';

/**
 * Stream nodes that are bound globally.
 */
export class StaticStreamNode<T> extends StaticNode<T> {
  constructor(
      id: StaticStreamId<T>,
      initTime: Time,
      private readonly fn_: Provider<T>,
      private readonly dependencies_: ImmutableList<StaticNode<any>> = ImmutableList.of()) {
    super(initTime, id);
  }

  protected async computeValue_(time: Time): Promise<T> {
    const args = this.dependencies_.map(dependency => dependency.getValue(time));

    return this.fn_.apply(null, await Promise.all([...args]));
  }

  getSources(): ImmutableSet<StaticSourceNode<any>> {
    const sourcesSet = new Set();
    for (const dependency of this.dependencies_) {
      for (const source of dependency.getSources()) {
        sourcesSet.add(source);
      }
    }

    return ImmutableSet.of(sourcesSet);
  }
}
