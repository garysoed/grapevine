import { ImmutableMap } from 'gs-tools/export/collect';
import { Errors } from 'gs-tools/export/error';
import { InstanceofType } from 'gs-types/export';
import { UnionType } from 'gs-types/src/union-type';
import { InstanceSourceId } from '../component/instance-source-id';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { Provider } from '../component/provider';
import { SourceId } from '../component/source-id';
import { StaticSourceId } from '../component/static-source-id';
import { StaticStreamId } from '../component/static-stream-id';
import { StreamId } from '../component/stream-id';
import { Time } from '../component/time';
import { SourceNode } from '../node/source-node';
import { StreamNode } from '../node/stream-node';
import { SourceRegistrationNode } from '../registration/source-registration-node';
import { StreamRegistrationNode } from '../registration/stream-registration-node';
import { VineImpl } from './vine-impl';

const StreamIdType = UnionType<StreamId<any>>([
  InstanceofType(InstanceStreamId),
  InstanceofType(StaticStreamId),
]);
const SourceIdType = UnionType<SourceId<any>>([
  InstanceofType(InstanceSourceId),
  InstanceofType(StaticSourceId),
]);

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
      if (!StreamIdType.check(childId)) {
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
  private readonly registeredSources_: Map<SourceId<any>, SourceRegistrationNode<any>> = new Map();
  private readonly registeredStreams_: Map<StreamId<any>, StreamRegistrationNode<any>> = new Map();

  constructor(private readonly window_: Window = window) { }

  run(): VineImpl {
    const sourceMap = new Map<SourceId<any>, SourceNode<any>>();
    for (const [sourceId, registration] of this.registeredSources_) {
      sourceMap.set(
          sourceId,
          new SourceNode(sourceId, this.currentTime_, registration.getInitValue()));
    }

    const sortedStreams = sortRegistrationMap(this.registeredStreams_);
    const streamMap = new Map<StreamId<any>, StreamNode<any>>();
    for (const [streamId, registration] of sortedStreams) {
      const dependencyNodes = registration.getDependencies()
          .mapItem(id => {
            let dependency = null;
            if (SourceIdType.check(id)) {
              dependency = sourceMap.get(id);
            }

            if (StreamIdType.check(id)) {
              dependency = streamMap.get(id);
            }

            if (!dependency) {
              throw new Error(`Dependency node ${id} cannot be found`);
            }

            return dependency;
          });
      const streamNode = new StreamNode(
          streamId,
          this.currentTime_,
          registration.getProvider(),
          dependencyNodes);
      streamMap.set(streamId, streamNode);
    }

    return new VineImpl(
        this.currentTime_,
        ImmutableMap.of(sourceMap),
        ImmutableMap.of(streamMap),
        this.window_);
  }

  source<T>(nodeId: SourceId<T>, initValue: T): void {
    const sourceRegistrationNode = new SourceRegistrationNode(this.currentTime_, nodeId, initValue);
    if (this.registeredSources_.has(nodeId)) {
      throw Errors.assert(`node ${nodeId}`).should('not have been registered').butWas('');
    }

    this.registeredSources_.set(nodeId, sourceRegistrationNode);
  }

  stream<T>(
      nodeId: StreamId<T>,
      provider: Provider<T>,
      ...args: NodeId<any>[]): void {
    const streamRegistration = new StreamRegistrationNode(
        this.currentTime_, nodeId, provider, args);
    if (this.registeredStreams_.has(nodeId)) {
      throw Errors.assert(`node ${nodeId}`).should('not have been registered').butWas('');
    }

    this.registeredStreams_.set(nodeId, streamRegistration);
  }
}
