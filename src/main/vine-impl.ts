import { ImmutableMap } from 'gs-tools/export/collect';
import { BaseDisposable } from 'gs-tools/export/dispose';
import { combineLatest, Observable } from 'rxjs';
import { InstanceSourceId } from '../component/instance-source-id';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { SourceId } from '../component/source-id';
import { StaticSourceId } from '../component/static-source-id';
import { StaticStreamId } from '../component/static-stream-id';
import { StreamId } from '../component/stream-id';
import { GLOBAL_CONTEXT } from '../node/global-context';
import { InstanceSourceSubject } from '../subject/instance-source-subject';
import { InstanceStreamSubject } from '../subject/instance-stream-subject';
import { SourceSubject } from '../subject/source-subject';
import { StaticSourceSubject } from '../subject/static-source-subject';
import { StaticStreamSubject } from '../subject/static-stream-subject';
import { StreamSubject } from '../subject/stream-subject';

type AnySubject<T> = InstanceSourceSubject<T>|InstanceStreamSubject<T>|
    StaticSourceSubject<T>|StaticStreamSubject<T>;

/**
 * Runtime implementation of Grapevine.
 */
export class VineImpl {
  constructor(
      private readonly sourceMap_: ImmutableMap<SourceId<any>, SourceSubject<any>>,
      private readonly streamMap_: ImmutableMap<StreamId<any>, StreamSubject<any>>) {
  }

  /**
   * @deprecated Use get observable.
   */
  async getLatest<T>(staticId: StaticSourceId<T>|StaticStreamId<T>): Promise<T>;
  async getLatest<T>(instanceId: InstanceSourceId<T>|InstanceStreamId<T>, context: BaseDisposable):
      Promise<T>;
  async getLatest<T>(nodeId: NodeId<T>, context: BaseDisposable = GLOBAL_CONTEXT): Promise<T> {
    const subject = this.getSubject_(nodeId);
    if (!subject) {
      throw new Error(`Node for ${nodeId} cannot be found`);
    }

    return getObs(subject, context).toPromise();
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
    const subject = this.getSubject_(nodeId);
    if (!subject) {
      throw new Error(`Node for ${nodeId} cannot be found`);
    }

    return getObs(subject, context);
  }

  private getSubject_(nodeId: NodeId<VineImpl>): AnySubject<VineImpl>;
  private getSubject_<T>(nodeId: NodeId<T>): AnySubject<T>|null;
  private getSubject_(nodeId: NodeId<any>): AnySubject<any>|null {
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

    const obsList = [];
    for (const id of nodeIds) {
      const subject = this.getSubject_(id);
      if (!subject) {
        throw new Error(`Node for ${id} cannot be found`);
      }

      obsList.push((getObs(subject, context)));
    }
    const subscription = combineLatest(obsList)
        .subscribe(args => handler.call(context, ...args));

    return () => {
      subscription.unsubscribe();
    };
  }

  setValue<T>(sourceId: StaticSourceId<T>, newValue: T): void;
  setValue<T>(sourceId: InstanceSourceId<T>, newValue: T, context: BaseDisposable): void;
  setValue<T>(sourceId: SourceId<T>, newValue: T, context: BaseDisposable = GLOBAL_CONTEXT): void {
    const sourceSubject = this.sourceMap_.get(sourceId);
    if (!sourceSubject) {
      throw new Error(`Source node for ${sourceId} cannot be found`);
    }

    if (sourceSubject instanceof InstanceSourceSubject) {
      sourceSubject.next(context, newValue);
    } else {
      sourceSubject.next(newValue);
    }
  }
}

function getObs<T>(subject: AnySubject<T>, context: BaseDisposable): Observable<T> {
  if (subject instanceof InstanceSourceSubject ||
      subject instanceof InstanceStreamSubject) {
    return subject.getObs(context);
  } else  {
    return subject.getObs();
  }
}
