import { ImmutableList, ImmutableMap, Orderings } from 'gs-tools/export/collect';
import { Annotations } from 'gs-tools/export/data';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { Observable } from 'rxjs';
import { VineInData } from '../annotation/vine-in';
import { InstanceSourceId } from '../component/instance-source-id';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { SourceId } from '../component/source-id';
import { StaticSourceId } from '../component/static-source-id';
import { StaticStreamId } from '../component/static-stream-id';
import { StreamId } from '../component/stream-id';
import { GLOBAL_CONTEXT } from '../node/global-context';
import { InstanceSourceNode } from '../node/instance-source-node';
import { InstanceStreamNode } from '../node/instance-stream-node';
import { StaticSourceNode } from '../node/static-source-node';
import { StaticStreamNode } from '../node/static-stream-node';

type AnyNode<T> = InstanceSourceNode<T>|InstanceStreamNode<T>|
    StaticSourceNode<T>| StaticStreamNode<T>;
type SourceNode<T> = StaticSourceNode<T>|InstanceSourceNode<T>;
type StreamNode<T> = StaticStreamNode<T>|InstanceStreamNode<T>;

/**
 * Runtime implementation of Grapevine.
 */
export class VineImpl {
  constructor(
      private readonly sourceMap_: ImmutableMap<SourceId<any>, SourceNode<any>>,
      private readonly streamMap_: ImmutableMap<StreamId<any>, StreamNode<any>>,
      private readonly vineInAnnotations: Annotations<VineInData>,
  ) { }

  private getNode(nodeId: NodeId<VineImpl>): AnyNode<VineImpl>;
  private getNode<T>(nodeId: NodeId<T>): AnyNode<T>|null;
  private getNode(nodeId: NodeId<any>): AnyNode<any>|null {
    if (nodeId instanceof StaticSourceId || nodeId instanceof InstanceSourceId) {
      return this.sourceMap_.get(nodeId) || null;
    }

    if (nodeId instanceof StaticStreamId || nodeId instanceof InstanceStreamId) {
      return this.streamMap_.get(nodeId) || null;
    }

    return null;
  }

  getObservable<T>(staticId: StaticSourceId<T>|StaticStreamId<T>): Observable<T>;
  getObservable<T>(
      instanceId: InstanceSourceId<T>|InstanceStreamId<T>,
      context: BaseDisposable,
  ): Observable<T>;
  getObservable<T>(
      nodeId: NodeId<T>,
      context: BaseDisposable = GLOBAL_CONTEXT,
  ): Observable<T> {
    const subject = this.getNode(nodeId);
    if (!subject) {
      throw new Error(`Node for ${nodeId} cannot be found`);
    }

    return getObs(subject, context);
  }

  resolveParams(
      context: BaseDisposable,
      propertyKey: string|symbol,
  ): ImmutableList<Observable<any>> {
    const values = this.vineInAnnotations
        .forCtor(context.constructor)
        .getAttachedValues()
        .get(propertyKey) || ImmutableList.of();

    return values
        .sort(Orderings.map(({index}) => index, Orderings.normal()))
        .mapItem(vineInData => {
          const node = this.getNode(vineInData.id);
          if (!node) {
            throw new Error(`Cannot find node for ${vineInData.id}`);
          }

          const obs = getObs(node, context);
          (obs as any)['$id'] = vineInData.id;

          return obs;
        });
  }

  setValue<T>(sourceId: StaticSourceId<T>, newValue: T): void;
  setValue<T>(sourceId: InstanceSourceId<T>, newValue: T, context: BaseDisposable): void;
  setValue<T>(sourceId: SourceId<T>, newValue: T, context: BaseDisposable = GLOBAL_CONTEXT): void {
    const sourceSubject = this.sourceMap_.get(sourceId);
    if (!sourceSubject) {
      throw new Error(`Source node for ${sourceId} cannot be found`);
    }

    if (sourceSubject instanceof InstanceSourceNode) {
      sourceSubject.next(context, newValue);
    } else {
      sourceSubject.next(newValue);
    }
  }
}

function getObs<T>(node: AnyNode<T>, context: BaseDisposable): Observable<T> {
  if (node instanceof InstanceSourceNode ||
      node instanceof InstanceStreamNode) {
    return node.getObs(context);
  } else  {
    return node.getObs();
  }
}
