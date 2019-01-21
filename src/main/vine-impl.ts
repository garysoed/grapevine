import { $exec, $flat, $getKey, $head, $map, $pick, ImmutableList, ImmutableMap, $filterPick } from 'gs-tools/export/collect';
import { PropertyAnnotation } from 'gs-tools/export/data';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { asImmutableList } from 'gs-tools/src/collect/types/immutable-list';
import { Observable } from 'rxjs';
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
      private readonly vineOutAnnotation: PropertyAnnotation<{id: InstanceStreamId<any>}>,
      private readonly vineOutParams: ImmutableMap<StreamId<any>, ImmutableList<NodeId<any>>>,
  ) { }

  private getNode(nodeId: NodeId<VineImpl>): AnyNode<VineImpl>;
  private getNode<T>(nodeId: NodeId<T>): AnyNode<T>|null;
  private getNode(nodeId: NodeId<any>): AnyNode<any>|null {
    if (nodeId instanceof StaticSourceId || nodeId instanceof InstanceSourceId) {
      return $exec(this.sourceMap_, $getKey(nodeId), $pick(1), $head()) || null;
    }

    if (nodeId instanceof StaticStreamId || nodeId instanceof InstanceStreamId) {
      return $exec(this.streamMap_, $getKey(nodeId), $pick(1), $head()) || null;
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

  private resolveParams(
      context: BaseDisposable,
      propertyKey: string|symbol,
  ): ImmutableList<Observable<any>> {
    const matchingEntry = $exec(
        this.vineOutAnnotation.getAttachedValues(context.constructor, propertyKey),
        $getKey(context.constructor as Object),
        $pick(1),
        $flat(),
        $head(),
    );

    if (!matchingEntry) {
      throw new Error(`${context}.${propertyKey.toString()} is not an output node`);
    }

    return $exec(
        this.vineOutParams,
        $getKey(matchingEntry.id as StreamId<any>),
        $pick(1),
        $flat(),
        $map(vineInId => {
          const node = this.getNode(vineInId);
          if (!node) {
            throw new Error(`Cannot find node for ${vineInId}`);
          }

          const obs = getObs(node, context);
          (obs as any)['$id'] = vineInId;

          return obs;
        }),
        asImmutableList(),
    );
  }

  // TODO: Return type and property type can be tighter.
  run<C extends BaseDisposable>(
      context: C,
      key: string|symbol,
  ): Observable<unknown> {
    const params = this.resolveParams(context, key);
    const fn = (context as any)[key];
    if (typeof fn !== 'function') {
      throw new Error(`Property ${key.toString()} of ${context} is not a function`);
    }

    return fn.call(context, ...params);
  }

  setValue<T>(sourceId: StaticSourceId<T>, newValue: T): void;
  setValue<T>(sourceId: InstanceSourceId<T>, newValue: T, context: BaseDisposable): void;
  setValue<T>(sourceId: SourceId<T>, newValue: T, context: BaseDisposable = GLOBAL_CONTEXT): void {
    const sourceSubject = $exec(
        this.sourceMap_,
        $getKey(sourceId),
        $pick(1),
        $head(),
    );
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
