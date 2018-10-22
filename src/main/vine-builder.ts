import { ImmutableList, ImmutableMap } from 'gs-tools/export/collect';
import { Errors } from 'gs-tools/export/error';
import { InstanceofType, IterableOfType } from 'gs-types/export';
import { UnionType } from 'gs-types/src/union-type';
import { InstanceSourceId } from '../component/instance-source-id';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { Provider, Provider0, Provider1, Provider2, Provider3 } from '../component/provider';
import { SourceId } from '../component/source-id';
import { StaticSourceId } from '../component/static-source-id';
import { StaticStreamId } from '../component/static-stream-id';
import { StreamId } from '../component/stream-id';
import { Time } from '../component/time';
import { GLOBAL_CONTEXT } from '../node/global-context';
import { InstanceSourceNode } from '../node/instance-source-node';
import { InstanceSourceProvider } from '../node/instance-source-provider';
import { InstanceStreamNode } from '../node/instance-stream-node';
import { SourceNode } from '../node/source-node';
import { StaticNode } from '../node/static-node';
import { StaticSourceNode } from '../node/static-source-node';
import { StaticSourceProvider } from '../node/static-source-provider';
import { StaticStreamNode } from '../node/static-stream-node';
import { InstanceSourceRegistrationNode } from '../registration/instance-source-registration-node';
import { StaticSourceRegistrationNode } from '../registration/static-source-registration-node';
import { StreamRegistrationNode } from '../registration/stream-registration-node';
import { $vine } from './vine-id';
import { VineImpl } from './vine-impl';

type StreamNode<T> = InstanceStreamNode<T>|StaticStreamNode<T>;
type SourceRegistrationNode<T> = StaticSourceRegistrationNode<T>|InstanceSourceRegistrationNode<T>;
type OnRunFn = (vine: VineImpl) => unknown;

const streamIdType = UnionType<StreamId<any>>([
  InstanceofType(InstanceStreamId),
  InstanceofType(StaticStreamId),
]);
const sourceIdType = UnionType<SourceId<any>>([
  InstanceofType(InstanceSourceId),
  InstanceofType(StaticSourceId),
]);
const staticStreamDependencyType = IterableOfType<StaticNode<any>, ImmutableList<StaticNode<any>>>(
   InstanceofType(StaticNode));

/**
 * Represents a node in the stream tree. Used for running topological sort of the stream tree.
 */
interface StreamTreeNode {
  children: Set<StreamTreeNode>;
  parents: Set<StreamTreeNode>;
  value: StreamId<any>;
}

function sortRegistrationMap(registrationMap: Map<StreamId<any>, StreamRegistrationNode<any>>):
    [StreamId<any>, StreamRegistrationNode<any>][] {
  // Create the graph.
  const potentialRoots = new Set(registrationMap.keys());
  const treeNodes = new Map<StreamId<any>, StreamTreeNode>();
  for (const [id, registration] of registrationMap) {
    const parent = treeNodes.get(id) || {children: new Set(), parents: new Set(), value: id};

    // Add the dependencies.
    for (const childId of registration.getDependencies()) {
      if (!streamIdType.check(childId)) {
        continue;
      }

      potentialRoots.delete(childId);
      const child = treeNodes.get(childId)
          || {children: new Set(), parents: new Set(), value: childId};
      parent.children.add(child);
      child.parents.add(parent);
      treeNodes.set(childId, child);
    }

    treeNodes.set(id, parent);
  }

  // Run topological sort.
  const sortedStreams: [StreamId<any>, StreamRegistrationNode<any>][] = [];
  while (potentialRoots.size > 0) {
    const rootId = [...potentialRoots][0];

    const rootNode = treeNodes.get(rootId);
    if (!rootNode) {
      // The node and its descendants have been processed. Continue on.
      continue;
    }

    const registration = registrationMap.get(rootId);
    if (!registration) {
      throw new Error(`Registration for ${rootId} not found`);
    }
    sortedStreams.push([rootId, registration]);

    // Go through the children and remove the parents.
    for (const childNode of rootNode.children) {
      childNode.parents.delete(rootNode);
      if (childNode.parents.size <= 0) {
        potentialRoots.add(childNode.value);
      }
    }

    treeNodes.delete(rootId);
    potentialRoots.delete(rootId);
  }

  if (treeNodes.size > 0) {
    const cyclicNodes = [...treeNodes.keys()].join(',');
    throw new Error(`Cyclic dependency found: [${cyclicNodes}]`);
  }

  return sortedStreams.reverse();
}

/**
 * Class to set up Grapevine.
 */
export class VineBuilder {
  private readonly currentTime_: Time = Time.new();
  private readonly onRunSet_: Set<OnRunFn> = new Set();
  private readonly registeredSources_: Map<SourceId<any>, SourceRegistrationNode<any>> = new Map();
  private readonly registeredStreams_: Map<StreamId<any>, StreamRegistrationNode<any>> = new Map();

  constructor(private readonly window_: Window = window) { }

  private createSourceNode_(
      sourceId: InstanceSourceId<any>|StaticSourceId<any>,
      registration: SourceRegistrationNode<any>): SourceNode<any> {
    if (sourceId instanceof InstanceSourceId) {
      return new InstanceSourceNode(sourceId, this.currentTime_, registration.getInitProvider());
    } else {
      return new StaticSourceNode(
          sourceId,
          this.currentTime_,
          () => registration.getInitProvider()(GLOBAL_CONTEXT));
    }
  }

  genericStream<T>(nodeId: StreamId<T>, provider: Provider<T>, ...args: NodeId<any>[]): void {
    this.stream_(nodeId, provider, ...args);
  }

  isRegistered(nodeId: SourceId<unknown>|StreamId<unknown>): boolean {
    if (nodeId instanceof StaticStreamId || nodeId instanceof InstanceStreamId) {
      return this.registeredStreams_.has(nodeId);
    } else {
      return this.registeredSources_.has(nodeId);
    }
  }

  onRun(callback: (vine: VineImpl) => unknown): void {
    this.onRunSet_.add(callback);
  }

  run(): VineImpl {
    const sourceMap = new Map<SourceId<any>, SourceNode<any>>();
    for (const [sourceId, registration] of this.registeredSources_) {
      sourceMap.set(sourceId, this.createSourceNode_(sourceId, registration));
    }

    const sortedStreams = sortRegistrationMap(this.registeredStreams_);
    const streamMap = new Map<StreamId<any>, StreamNode<any>>();
    for (const [streamId, registration] of sortedStreams) {
      const dependencyNodes = registration.getDependencies()
          .mapItem(id => {
            let dependency = null;
            if (sourceIdType.check(id)) {
              dependency = sourceMap.get(id);
            }

            if (streamIdType.check(id)) {
              dependency = streamMap.get(id);
            }

            if (!dependency) {
              throw new Error(`Dependency node ${id} cannot be found`);
            }

            return dependency;
          });

      let streamNode;
      if (streamId instanceof InstanceStreamId) {
        streamNode = new InstanceStreamNode(
            streamId,
            this.currentTime_,
            registration.getProvider(),
            dependencyNodes);
      } else {
        if (!staticStreamDependencyType.check(dependencyNodes)) {
          throw Errors.assert(`Dependencies of [${streamId}]`)
              .shouldBeA(staticStreamDependencyType).butWas(dependencyNodes);
        }

        streamNode = new StaticStreamNode(
            streamId,
            this.currentTime_,
            registration.getProvider(),
            dependencyNodes);
      }
      streamMap.set(streamId, streamNode);
    }

    // Add the VineNode.
    let vine: VineImpl;
    const vineNode = new StaticSourceNode($vine, this.currentTime_, () => vine);
    sourceMap.set($vine, vineNode);

    vine = new VineImpl(
        this.currentTime_,
        ImmutableMap.of(sourceMap),
        ImmutableMap.of(streamMap),
        this.window_);

    for (const onRun of this.onRunSet_) {
      onRun(vine);
    }

    return vine;
  }

  source<T>(nodeId: SourceId<T>, initValue: T): void {
    this.sourceWithProvider(nodeId, () => initValue);
  }

  sourceWithProvider<T>(nodeId: StaticSourceId<T>, provider: StaticSourceProvider<T>): void;
  sourceWithProvider<T>(nodeId: SourceId<T>, provider: InstanceSourceProvider<T>): void;
  sourceWithProvider<T>(
      nodeId: SourceId<T>,
      provider: StaticSourceProvider<T>|InstanceSourceProvider<T>): void {
    if (this.registeredSources_.has(nodeId)) {
      throw Errors.assert(`node ${nodeId}`).should('not have been registered').butWas('');
    }

    let sourceRegistrationNode;
    if (nodeId instanceof StaticSourceId) {
      sourceRegistrationNode = new StaticSourceRegistrationNode(
          this.currentTime_,
          nodeId,
          provider as StaticSourceProvider<T>);
    } else {
      sourceRegistrationNode = new InstanceSourceRegistrationNode(
          this.currentTime_,
          nodeId,
          provider);
    }

    this.registeredSources_.set(nodeId, sourceRegistrationNode);
  }

  stream<T>(
      nodeId: StaticStreamId<T>|InstanceStreamId<T>,
      provider: Provider0<T>): void;

  stream<T, P0>(
      nodeId: StaticStreamId<T>,
      provider: Provider1<T, P0>,
      arg0: StaticStreamId<P0>|StaticSourceId<P0>): void;
  stream<T, P0, P1>(
      nodeId: StaticStreamId<T>,
      provider: Provider2<T, P0, P1>,
      arg0: StaticStreamId<P0>|StaticSourceId<P0>,
      arg1: StaticStreamId<P1>|StaticSourceId<P1>): void;
  stream<T, P0, P1, P2>(
      nodeId: StaticStreamId<T>,
      provider: Provider3<T, P0, P1, P2>,
      arg0: StaticStreamId<P0>|StaticSourceId<P0>,
      arg1: StaticStreamId<P1>|StaticSourceId<P1>,
      arg2: StaticStreamId<P2>|StaticSourceId<P2>): void;

  stream<T, P0>(
      nodeId: InstanceStreamId<T>,
      provider: Provider1<T, P0>,
      arg0: NodeId<P0>): void;
  stream<T, P0, P1>(
      nodeId: InstanceStreamId<T>,
      provider: Provider2<T, P0, P1>,
      arg0: NodeId<P0>,
      arg1: NodeId<P1>): void;
  stream<T, P0, P1, P2>(
      nodeId: InstanceStreamId<T>,
      provider: Provider3<T, P0, P1, P2>,
      arg0: NodeId<P0>,
      arg1: NodeId<P1>,
      arg2: NodeId<P2>): void;

  stream<T>(nodeId: StreamId<T>, provider: Provider<T>, ...args: NodeId<any>[]): void {
    this.stream_(nodeId, provider, ...args);
  }

  stream_<T>(nodeId: StreamId<T>, provider: Provider<T>, ...args: NodeId<any>[]): void {
    const streamRegistration = new StreamRegistrationNode(
        this.currentTime_, nodeId, provider, args);
    if (this.registeredStreams_.has(nodeId)) {
      throw Errors.assert(`node ${nodeId}`).should('not have been registered').butWas('');
    }

    this.registeredStreams_.set(nodeId, streamRegistration);
  }
}
