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
import { GLOBAL_CONTEXT } from '../node/global-context';
import { InstanceNode } from '../node/instance-node';
import { InstanceSourceNode } from '../node/instance-source-node';
import { InstanceStreamNode } from '../node/instance-stream-node';
import { Listener } from '../node/listener';
import { SourceNode } from '../node/source-node';
import { StaticNode } from '../node/static-node';
import { StaticStreamNode } from '../node/static-stream-node';
import { RequestQueue } from './request-queue';

type AnyNode<T> = StaticNode<T>|InstanceNode<T>;
type StreamNode<T> = InstanceStreamNode<T>|StaticStreamNode<T>;

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

  async getLatest<T>(staticId: StaticSourceId<T>|StaticStreamId<T>): Promise<T>;
  async getLatest<T>(instanceId: InstanceSourceId<T>|InstanceStreamId<T>, context: BaseDisposable):
      Promise<T>;
  async getLatest<T>(nodeId: NodeId<T>, context: BaseDisposable = GLOBAL_CONTEXT): Promise<T> {
    const node = this.getNode_(nodeId);
    if (!node) {
      throw new Error(`Node for ${nodeId} cannot be found`);
    }

    const time = this.requestQueue_.getTime();
    if (node instanceof InstanceNode) {
      return node.getValue(context, time);
    } else {
      return node.getValue(time);
    }
  }

  private getNode_(nodeId: NodeId<VineImpl>): AnyNode<VineImpl>;
  private getNode_<T>(nodeId: NodeId<T>): AnyNode<T>|null;
  private getNode_(nodeId: NodeId<any>): AnyNode<any>|null {
    if (nodeId instanceof StaticSourceId || nodeId instanceof InstanceSourceId) {
      return this.sourceMap_.get(nodeId) || null;
    }

    if (nodeId instanceof StaticStreamId || nodeId instanceof InstanceStreamId) {
      return this.streamMap_.get(nodeId) || null;
    }

    return null;
  }

  listen<T>(
      nodeId: InstanceSourceId<T> | InstanceStreamId<T>,
      handler: Listener<T>,
      context: BaseDisposable): () => void;
  listen<T>(nodeId: StaticSourceId<T> | StaticStreamId<T>, handler: Listener<T>): () => void;
  listen<T>(
      nodeId: NodeId<T>,
      handler: Listener<T>,
      context: BaseDisposable = GLOBAL_CONTEXT): () => void {
    const node = this.getNode_(nodeId);
    if (!node) {
      throw new Error(`Node for ${nodeId} cannot be found`);
    }

    const wrappedHandler = async () => {
      const time = this.requestQueue_.getTime();
      if (node instanceof InstanceNode) {
        handler(await node.getValue(context, time));
      } else {
        handler(await node.getValue(time));
      }
    };
    const unlistenFns = node.getSources()
        .mapItem(source => {
          if (source instanceof InstanceSourceNode) {
            return source.listen(wrappedHandler, context);
          } else {
            return source.listen(wrappedHandler);
          }
        });

    // tslint:disable-next-line:no-floating-promises
    wrappedHandler();

    return () => {
      for (const unlistenFn of unlistenFns) {
        unlistenFn();
      }
    };
  }

  setValue<T>(sourceId: StaticSourceId<T>, newValue: T): void;
  setValue<T>(sourceId: InstanceSourceId<T>, newValue: T, context: BaseDisposable): void;
  setValue<T>(sourceId: SourceId<T>, newValue: T, context: BaseDisposable = GLOBAL_CONTEXT): void {
    const sourceNode = this.sourceMap_.get(sourceId);
    if (!sourceNode) {
      throw new Error(`Source node for ${sourceId} cannot be found`);
    }

    if (sourceNode instanceof InstanceSourceNode) {
      this.requestQueue_.queue(time => sourceNode.setValue(newValue, context, time));
    } else {
      this.requestQueue_.queue(time => sourceNode.setValue(newValue, time));
    }
  }
}
