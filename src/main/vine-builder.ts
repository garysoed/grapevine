import { $declareFinite, $exec, $filterPick, $flat, $getKey, $head, $keys, $map, $mapPick, $pick, $scan, asImmutableList, asImmutableMap, createImmutableList, createImmutableMap, ImmutableList, ImmutableMap } from 'gs-tools/export/collect';
import { ClassAnnotator, ParameterAnnotator, PropertyAnnotator } from 'gs-tools/export/data';
import { Errors } from 'gs-tools/export/error';
import { InstanceofType, IterableOfType, UnionType } from 'gs-types/export';
import { Observable, of as observableOf } from 'rxjs';
import { InstanceSourceId } from '../component/instance-source-id';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { Provider, Provider0, Provider1, Provider2, Provider3 } from '../component/provider';
import { SourceId } from '../component/source-id';
import { StaticSourceId } from '../component/static-source-id';
import { StaticStreamId } from '../component/static-stream-id';
import { StreamId } from '../component/stream-id';
import { InstanceSourceNode } from '../node/instance-source-node';
import { InstanceSourceProvider } from '../node/instance-source-provider';
import { InstanceStreamNode } from '../node/instance-stream-node';
import { StaticNode } from '../node/static-node';
import { StaticSourceNode } from '../node/static-source-node';
import { StaticSourceProvider } from '../node/static-source-provider';
import { StaticStreamNode } from '../node/static-stream-node';
import { InstanceSourceRegistrationNode } from '../registration/instance-source-registration-node';
import { StaticSourceRegistrationNode } from '../registration/static-source-registration-node';
import { StreamRegistrationNode } from '../registration/stream-registration-node';
import { $vine } from './vine-id';
import { VineImpl } from './vine-impl';

type SourceNode<T> = StaticSourceNode<T>|InstanceSourceNode<T>;
type StreamNode<T> = StaticStreamNode<T>|InstanceStreamNode<T>;
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
const staticStreamDependencyType =
    IterableOfType<StaticNode<any>, ImmutableList<StaticNode<any>>>(
        UnionType([
          InstanceofType(StaticStreamNode),
          InstanceofType(StaticSourceNode),
        ]));

/**
 * Represents a node in the stream tree. Used for running topological sort of the stream tree.
 */
interface StreamTreeNode {
  children: Set<StreamTreeNode>;
  parents: Set<StreamTreeNode>;
  value: StreamId<any>;
}

/**
 * Class to set up Grapevine.
 */
export class VineBuilder {
  private readonly onRunSet_: Set<OnRunFn> = new Set();
  private readonly registeredSources_: Map<SourceId<any>, SourceRegistrationNode<any>> = new Map();
  private readonly registeredStreams_: Map<StreamId<any>, StreamRegistrationNode<any>> = new Map();

  constructor(
      private readonly vineInAnnotation: ParameterAnnotator<{id: NodeId<any>}, any>,
      private readonly vineOutAnnotation: PropertyAnnotator<{id: InstanceStreamId<any>}, any>,
      private readonly vineOutWithForwardingParams:
          ClassAnnotator<{inId: NodeId<any>; outId: InstanceStreamId<any>}, any>,
  ) { }

  genericStream<T>(nodeId: StreamId<T>, provider: Provider<T>, ...args: Array<NodeId<any>>): void {
    this.stream_(nodeId, provider, ...args);
  }

  private getStreams(ctors: Function[]): ImmutableMap<StreamId<any>, StreamRegistrationNode<any>> {
    const registeredStreams = createImmutableMap(this.registeredStreams_);

    const vineOutMap: Map<StreamId<any>, StreamRegistrationNode<any>> = new Map();
    for (const ctor of ctors) {
      // Register the nodes from vine out without forwarding.
      const annotatedPropertyValues: ImmutableMap<string|symbol, InstanceStreamId<any>> =
          $exec(
              this.vineOutAnnotation.data.getAttachedValuesForCtor(ctor),
              $mapPick(
                  1,
                  (objMap): InstanceStreamId<any>|undefined => $exec(
                      objMap,
                      $pick(1),
                      $flat(),
                      $map(({id}) => id),
                      $declareFinite(),
                      $head(),
                  ),
              ),
              $filterPick(1, (id): id is InstanceStreamId<any> => !!id),
              asImmutableMap(),
          );

      for (const [propertyKey, outId] of annotatedPropertyValues) {
        const dependenciesMap: ImmutableMap<number, NodeId<any>> = $exec(
            this.vineInAnnotation.data.getAttachedValuesForKey(ctor, propertyKey),
            $mapPick(
                1,
                (objMap): NodeId<any>|undefined => $exec(
                    objMap,
                    $pick(1),
                    $flat(),
                    $map(({id}) => id),
                    $head(),
                ),
            ),
            $filterPick(1, (id): id is NodeId<any> => !!id),
            asImmutableMap(),
        );

        // Creates the dependency array.
        const maxIndex = $exec(
            dependenciesMap,
            $pick(0),
            $scan((max, current) => Math.max(max, current), -1),
            $head(),
        );
        const paramCount = maxIndex === undefined ? 0 : maxIndex + 1;

        const dependencies: Array<NodeId<any>> = [];
        for (let i = 0; i < paramCount; i++) {
          const id = $exec(dependenciesMap, $getKey(i), $pick(1), $head());
          if (id !== undefined) {
            dependencies[i] = id;
          }
        }

        const providerFn = ctor.prototype[propertyKey] ||
            function(this: any): Observable<any> { return observableOf(this[propertyKey]); };

        vineOutMap.set(
            outId,
            {
              dependencies: createImmutableList(dependencies),
              id: outId,
              providerFn,
            });
      }

      // Register the nodes from vineOut with forwarding.
      const specs: ImmutableList<{inId: NodeId<any>; outId: InstanceStreamId<any>}> =
          $exec(
              this.vineOutWithForwardingParams.data.getAttachedValues(ctor),
              $pick(1),
              $flat(),
              $declareFinite(),
              asImmutableList(),
          );
      for (const {inId, outId} of specs) {
        vineOutMap.set(
            outId,
            {
              dependencies: createImmutableList([inId]),
              id: outId,
              providerFn: v => v,
            },
        );
      }
    }

    return createImmutableMap([...registeredStreams, ...vineOutMap]);
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

  run(ctors: Function[]): VineImpl {
    const sourceMap = new Map<SourceId<any>, SourceNode<any>>();
    for (const [sourceId, registration] of this.registeredSources_) {
      sourceMap.set(sourceId, createSourceNode_(sourceId, registration));
    }

    const streams = this.getStreams(ctors);
    const sortedStreams = sortRegistrationMap(streams);
    const streamMap = new Map<StreamId<any>, StreamNode<any>>();
    for (const [streamId, registration] of sortedStreams) {
      const dependencyNodes: ImmutableList<SourceNode<any>|StreamNode<any>> =
          $exec(
              registration.dependencies,
              $map(id => {
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
              }),
              asImmutableList(),
          );

      let streamNode;
      if (streamId instanceof InstanceStreamId) {
        streamNode = new InstanceStreamNode(
            createImmutableList([...dependencyNodes]),
            registration.providerFn);
      } else {
        if (!staticStreamDependencyType.check(dependencyNodes)) {
          throw Errors.assert(`Dependencies of [${streamId}]`)
              .shouldBeA(staticStreamDependencyType).butWas(dependencyNodes);
        }

        streamNode = new StaticStreamNode(dependencyNodes, registration.providerFn);
      }
      streamMap.set(streamId, streamNode);
    }

    // Add the VineNode.
    let vine: VineImpl;
    const vineNode = new StaticSourceNode(() => vine);
    sourceMap.set($vine, vineNode);

    const vineOutParams: ImmutableMap<StreamId<any>, ImmutableList<NodeId<any>>> = $exec(
        streams,
        $mapPick(1, registrationNode => registrationNode.dependencies),
        asImmutableMap(),
    );
    vine = new VineImpl(
        createImmutableMap(sourceMap),
        createImmutableMap(streamMap),
        this.vineOutAnnotation.data,
        vineOutParams,
    );

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

    let sourceRegistrationNode: InstanceSourceRegistrationNode<T>|StaticSourceRegistrationNode<T>;
    if (nodeId instanceof StaticSourceId) {
      sourceRegistrationNode = {
        id: nodeId,
        initProvider: provider,
      };
    } else {
      sourceRegistrationNode = {
        id: nodeId,
        initProvider: provider,
      };
    }

    this.registeredSources_.set(nodeId, sourceRegistrationNode);
  }

  stream<V>(
      nodeId: StaticStreamId<V>,
      provider: Provider0<V, void>): void;
  stream<V, P0>(
      nodeId: StaticStreamId<V>,
      provider: Provider1<V, void, P0>,
      arg0: StaticStreamId<P0>|StaticSourceId<P0>): void;
  stream<V, P0, P1>(
      nodeId: StaticStreamId<V>,
      provider: Provider2<V, void, P0, P1>,
      arg0: StaticStreamId<P0>|StaticSourceId<P0>,
      arg1: StaticStreamId<P1>|StaticSourceId<P1>): void;
  stream<V, P0, P1, P2>(
      nodeId: StaticStreamId<V>,
      provider: Provider3<V, void, P0, P1, P2>,
      arg0: StaticStreamId<P0>|StaticSourceId<P0>,
      arg1: StaticStreamId<P1>|StaticSourceId<P1>,
      arg2: StaticStreamId<P2>|StaticSourceId<P2>): void;


  stream<V, T>(
      nodeId: InstanceStreamId<V>,
      provider: Provider0<V, T>): void;
  stream<V, T, P0>(
      nodeId: InstanceStreamId<V>,
      provider: Provider1<V, T, P0>,
      arg0: NodeId<P0>): void;
  stream<V, T, P0, P1>(
      nodeId: InstanceStreamId<V>,
      provider: Provider2<V, T, P0, P1>,
      arg0: NodeId<P0>,
      arg1: NodeId<P1>): void;
  stream<V, T, P0, P1, P2>(
      nodeId: InstanceStreamId<V>,
      provider: Provider3<V, T, P0, P1, P2>,
      arg0: NodeId<P0>,
      arg1: NodeId<P1>,
      arg2: NodeId<P2>): void;

  stream<T>(nodeId: StreamId<T>, provider: Provider<T>, ...args: Array<NodeId<any>>): void {
    this.stream_(nodeId, provider, ...args);
  }

  stream_<T>(nodeId: StreamId<T>, provider: Provider<T>, ...args: Array<NodeId<any>>): void {
    const streamRegistration = {
      dependencies: createImmutableList(args),
      id: nodeId,
      providerFn: provider,
    };
    if (this.registeredStreams_.has(nodeId)) {
      throw Errors.assert(`node ${nodeId}`).should('not have been registered').butWas('');
    }

    this.registeredStreams_.set(nodeId, streamRegistration);
  }
}

function sortRegistrationMap(
    registrationMap: ImmutableMap<StreamId<any>, StreamRegistrationNode<any>>,
): Array<[StreamId<any>, StreamRegistrationNode<any>]> {
  // Create the graph.
  const potentialRoots = new Set($exec(registrationMap, $keys())());
  const treeNodes = new Map<StreamId<any>, StreamTreeNode>();
  for (const [id, registration] of registrationMap) {
    const parent = treeNodes.get(id) || {children: new Set(), parents: new Set(), value: id};

    // Add the dependencies.
    for (const childId of registration.dependencies) {
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
  const sortedStreams: Array<[StreamId<any>, StreamRegistrationNode<any>]> = [];
  while (potentialRoots.size > 0) {
    const rootId = [...potentialRoots][0];

    const rootNode = treeNodes.get(rootId);
    if (!rootNode) {
      // The node and its descendants have been processed. Continue on.
      continue;
    }

    const registration = $exec(registrationMap, $getKey(rootId), $pick(1), $head());
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

function createSourceNode_<T>(
    sourceId: InstanceSourceId<T>|StaticSourceId<T>,
    registration: SourceRegistrationNode<T>): SourceNode<T> {
  if (sourceId instanceof InstanceSourceId) {
    return new InstanceSourceNode(registration.initProvider);
  } else {
    return new StaticSourceNode(registration.initProvider as StaticSourceProvider<T>);
  }
}
