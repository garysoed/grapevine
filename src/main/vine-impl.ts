import { ImmutableMap } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { InstanceSourceId } from '../component/instance-source-id';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { SourceId } from '../component/source-id';
import { StaticSourceId } from '../component/static-source-id';
import { StaticStreamId } from '../component/static-stream-id';
import { StreamId } from '../component/stream-id';
import { Time } from '../component/time';
import { Listener } from '../node/listener';
import { SourceNode } from '../node/source-node';
import { StreamNode } from '../node/stream-node';
import { VineNode } from '../node/vine-node';
import { RequestQueue } from './request-queue';

/**
 * Runtime implementation of Grapevine.
 */
export class VineImpl {
  private readonly requestQueue_: RequestQueue;

  constructor(
      time: Time,
      private readonly sourceMap_: ImmutableMap<SourceId<any>, SourceNode<any>>,
      private readonly streamMap_: ImmutableMap<StreamId<any>, StreamNode<any>>,
      window: Window) {
    this.requestQueue_ = new RequestQueue(time, window);
  }

  private getNode_<T>(nodeId: NodeId<T>): VineNode<T>|null {
    if (nodeId instanceof StaticSourceId || nodeId instanceof InstanceSourceId) {
      return this.sourceMap_.get(nodeId) || null;
    }

    if (nodeId instanceof StaticStreamId || nodeId instanceof InstanceStreamId) {
      return this.streamMap_.get(nodeId) || null;
    }

    return null;
  }

  listen<T>(nodeId: NodeId<T>, context: BaseDisposable, handler: Listener<T>): () => void {
    const node = this.getNode_(nodeId);
    if (!node) {
      throw new Error(`Node for ${nodeId} cannot be found`);
    }

    const wrappedHandler = async () => {
      handler(await node.getValue(context, this.requestQueue_.getTime()));
    };
    const unlistenFns = node.getSources().mapItem(source => source.listen(wrappedHandler, context));

    // tslint:disable-next-line:no-floating-promises
    wrappedHandler();

    return () => {
      for (const unlistenFn of unlistenFns) {
        unlistenFn();
      }
    };
  }

  setValue<T>(sourceId: SourceId<T>, context: BaseDisposable, newValue: T): void {
    const sourceNode = this.sourceMap_.get(sourceId);
    if (!sourceNode) {
      throw new Error(`Source node for ${sourceId} cannot be found`);
    }

    this.requestQueue_.queue(time => sourceNode.setValue(newValue, context, time));
  }
}
