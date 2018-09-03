import { ImmutableMap, ImmutableSet } from 'gs-tools/export/collect';
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
      handler: (value: T) => void,
      context: BaseDisposable,
      nodeId: NodeId<T>): () => void;
  listen<T1, T2>(
      handler: (value1: T1, value2: T2) => void,
      context: BaseDisposable,
      nodeId1: NodeId<T1>,
      nodeId2: NodeId<T2>): () => void;

  listen<T>(
      handler: (value: T) => void,
      nodeId: StaticSourceId<T>|StaticStreamId<T>): () => void;
  listen<T1, T2>(
      handler: (value1: T1, value2: T2) => void,
      nodeId1: StaticSourceId<T1>|StaticStreamId<T1>,
      nodeId2: StaticSourceId<T2>|StaticStreamId<T2>): () => void;

  listen(
      handler: (...args: any[]) => void,
      contextOrId: BaseDisposable|NodeId<any>,
      ...rawNodeIds: NodeId<any>[]): () => void {
    // Normalize the context and node
    const context = contextOrId instanceof BaseDisposable ? contextOrId : GLOBAL_CONTEXT;
    const nodeIds = contextOrId instanceof NodeId ? [contextOrId, ...rawNodeIds] : rawNodeIds;

    // Collect the nodes and source nodes.
    const sourceNodes = new Set<SourceNode<any>>();
    const nodes = new Map<NodeId<any>, AnyNode<any>>();
    for (const nodeId of nodeIds) {
      const node = this.getNode_(nodeId);
      if (!node) {
        throw new Error(`Node for ${nodeId} cannot be found`);
      }

      for (const sourceNode of node.getSources()) {
        sourceNodes.add(sourceNode);
      }
      nodes.set(nodeId, node);
    }

    // Create the wrapped handler.
    const wrappedHandler = async () => {
      const time = this.requestQueue_.getTime();
      const valuePromises = [];
      for (const nodeId of nodeIds) {
        // tslint:disable-next-line:no-non-null-assertion
        const node = nodes.get(nodeId)!;

        if (node instanceof InstanceNode) {
          valuePromises.push(node.getValue(context, time));
        } else {
          valuePromises.push(node.getValue(time));
        }
      }

      const values = await Promise.all(valuePromises);
      handler(...values);
    };

    const unlistenFns = ImmutableSet
        .of(sourceNodes)
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
      this.requestQueue_.queue(sourceNode, context, async time => {
        const latestValue = await sourceNode.getValue(context, time);
        if (latestValue !== newValue) {
          sourceNode.setValue(newValue, context, time);
        }
      });
    } else {
      this.requestQueue_.queue(sourceNode, context, async time => {
        const latestValue = await sourceNode.getValue(time);
        if (latestValue !== newValue) {
          sourceNode.setValue(newValue, time);
        }
      });
    }
  }
}
