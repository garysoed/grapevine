import { $concat, $debug, $declareFinite, $filter, $filterPick, $flat, $getKey, $hasEntry, $head, $keys, $map, $mapPick, $pick, $pipe, $push, $scan, $tail, asImmutableList, asImmutableMap, asImmutableSet, createImmutableList, createImmutableMap, ImmutableList, ImmutableMap, ImmutableSet } from '@gs-tools/collect';
import { ClassAnnotation, ClassAnnotator, ParameterAnnotation, ParameterAnnotator, PropertyAnnotation, PropertyAnnotator } from '@gs-tools/data';
import { Errors } from '@gs-tools/error';
import { declareKeyed } from 'gs-tools/src/collect/operators/declare-keyed';
import { filterPick } from 'gs-tools/src/collect/operators/filter-pick';
import { mapPick } from 'gs-tools/src/collect/operators/map-pick';
import { AnyType, InstanceofType, IterableOfType, UnionType } from 'gs-types/export';
import { Observable, of as observableOf, Subscription } from 'rxjs';
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
const staticStreamDependencyType = AnyType<ImmutableList<StaticNode<any>>>();

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
      private readonly vineInAnnotator: ParameterAnnotator<{id: NodeId<any>}, any>,
      private readonly vineOutAnnotator: PropertyAnnotator<{id: InstanceStreamId<any>}, any>,
      private readonly vineOutWithForwardingParams:
          ClassAnnotator<{inId: NodeId<any>; outId: InstanceStreamId<any>}, any>,
  ) { }

  genericStream<T>(nodeId: StreamId<T>, provider: Provider<T>, ...args: Array<NodeId<any>>): void {
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

  run(ctors: Function[]): VineImpl {
    let vine: VineImpl;
    const vineInAnnotation = this.vineInAnnotator.data;
    const vineOutAnnotation = this.vineOutAnnotator.data;
    const vineOutWithForwardingAnnotation = this.vineOutWithForwardingParams.data;
    const sourceMap = createSourceNodes(
        this.registeredSources_,
        () => vine,
    );
    const vineOutRegistrationNodes = createVineOutRegistrationStreamNodes(
        ctors,
        vineInAnnotation,
        vineOutAnnotation,
        vineOutWithForwardingAnnotation,
    );
    const streamMap = createStreamNodes(
        createImmutableMap(this.registeredStreams_),
        vineOutRegistrationNodes,
        sourceMap,
    );

    vine = new VineImpl(
        sourceMap,
        streamMap,
        createPropertyToNodeMap(
            ctors,
            vineInAnnotation,
            vineOutAnnotation,
            sourceMap,
            streamMap,
        ),
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

function createDependencyArray(
    dependenciesMap: ImmutableMap<number, NodeId<any>>,
): Array<NodeId<any>> {
  const maxIndex = $pipe(
      dependenciesMap,
      $pick(0),
      $scan((max, current) => Math.max(max, current), -1),
      $tail(),
  );
  const paramCount = maxIndex === undefined ? 0 : maxIndex + 1;

  const dependencies: Array<NodeId<any>> = [];
  for (let i = 0; i < paramCount; i++) {
    const id = $pipe(dependenciesMap, $getKey(i), $pick(1), $head());
    if (id !== undefined) {
      dependencies[i] = id;
    }
  }

  return dependencies;
}

function createVineOutRegistrationStreamNodes(
    ctors: Function[],
    vineInAnnotation: ParameterAnnotation<{id: NodeId<any>}>,
    vineOutAnnotation: PropertyAnnotation<{id: InstanceStreamId<any>}>,
    vineOutWithForwardingParams: ClassAnnotation<{inId: NodeId<any>; outId: InstanceStreamId<any>}>,
): ImmutableMap<StreamId<any>, StreamRegistrationNode<any>> {
  const vineOutMap: Map<StreamId<any>, StreamRegistrationNode<any>> = new Map();
  for (const ctor of ctors) {
    // Register the nodes from vine out without forwarding.
    const annotatedPropertyValues: ImmutableMap<string|symbol, InstanceStreamId<any>> =
        $pipe(
            vineOutAnnotation.getAttachedValuesForCtor(ctor),
            $mapPick(
                1,
                (objMap): InstanceStreamId<any>|undefined => $pipe(
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
      const dependenciesMap: ImmutableMap<number, NodeId<any>> = $pipe(
          vineInAnnotation.getAttachedValuesForKey(ctor, propertyKey),
          $mapPick(
              1,
              (objMap): NodeId<any>|undefined => $pipe(
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

      const dependencies = createDependencyArray(dependenciesMap);
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
        $pipe(
            vineOutWithForwardingParams.getAttachedValues(ctor),
            $pick(1),
            $flat(),
            $declareFinite(),
            asImmutableList(),
        );
    for (const {inId, outId} of specs()) {
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

  return createImmutableMap(vineOutMap);
}

function createSourceNodes(
    registeredSources: Map<SourceId<any>, SourceRegistrationNode<any>>,
    vineProvider: () => VineImpl,
): ImmutableMap<SourceId<any>, SourceNode<any>> {
  const sourceMap = new Map<SourceId<any>, SourceNode<any>>();
  for (const [sourceId, registration] of registeredSources) {
    sourceMap.set(sourceId, createSourceNode_(sourceId, registration));
  }

  // Add the VineNode.
  const vineNode = new StaticSourceNode(vineProvider);
  sourceMap.set($vine, vineNode);

  return createImmutableMap(sourceMap);
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

function createStreamNodes(
    registeredStreams: ImmutableMap<StreamId<any>, StreamRegistrationNode<any>>,
    vineOutRegistrationNodes: ImmutableMap<StreamId<any>, StreamRegistrationNode<any>>,
    sourceNodes: ImmutableMap<SourceId<any>, SourceNode<any>>,
): ImmutableMap<StreamId<any>, StreamNode<any>> {
  const streams = createImmutableMap([...registeredStreams, ...vineOutRegistrationNodes]);

  const sortedStreams = sortRegistrationMap(streams);
  const streamMap = new Map<StreamId<any>, StreamNode<any>>();
  for (const [streamId, registration] of sortedStreams) {
    const dependencyNodes: ImmutableList<SourceNode<any>|StreamNode<any>> =
        $pipe(
            registration.dependencies,
            $map(id => {
              let dependency: StreamNode<any>|SourceNode<any>|null = null;
              if (sourceIdType.check(id)) {
                dependency = $pipe(sourceNodes, $getKey(id), $pick(1), $head()) || null;
              }

              if (streamIdType.check(id)) {
                dependency = streamMap.get(id) || null;
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
          createImmutableList([...dependencyNodes()]),
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

  return createImmutableMap(streamMap);
}

function createPropertyToNodeMap(
    ctors: Function[],
    vineInAnnotation: ParameterAnnotation<{id: NodeId<any>}>,
    vineOutAnnotation: PropertyAnnotation<{id: InstanceStreamId<any>}>,
    sourceIdToNodeMap: ImmutableMap<SourceId<any>, SourceNode<any>>,
    streamIdToNodeMap: ImmutableMap<StreamId<any>, StreamNode<any>>,
): ImmutableMap<Function, ImmutableMap<string|symbol, StreamNode<any>>> {
  return $pipe(
      createImmutableList(ctors),
      $map(ctor => {
        const vineOutAttachedValues = vineOutAnnotation.getAttachedValuesForCtor(ctor);
        const vineOutMap: ImmutableMap<string|symbol, StreamNode<any>> = $pipe(
            vineOutAttachedValues,
            mapPick(
                1,
                objDataMap => $pipe(
                    objDataMap,
                    $getKey(ctor as Object),
                    $pick(1),
                    $flat<{id: InstanceStreamId<any>}>(),
                    $map(({id}) => $pipe(
                        streamIdToNodeMap,
                        $getKey(id as StreamId<any>),
                        $pick(1),
                        $head(),
                    )),
                    $head(),
                ),
            ),
            filterPick(1, (node): node is StreamNode<any> => !!node),
            asImmutableMap(),
        );

        const vineOutKeys: ImmutableSet<string|symbol> = $pipe(
            vineOutAttachedValues,
            $keys(),
            asImmutableSet(),
        );

        const c1 = $pipe(
            vineInAnnotation.getAttachedValuesForCtor(ctor),
            // Filter out the keys that have vineOut annotation
            $filterPick(0, key => !$pipe(vineOutKeys, $hasEntry(key))),
        );
        const attachedValues = $pipe(
            c1,
            $map(
              ([key, paramObjMap]) => {
                const paramMap: ImmutableMap<number, NodeId<any>> = $pipe(
                    paramObjMap,
                    $mapPick(
                        1,
                        objDataMap => $pipe(
                            objDataMap,
                            $pick(1),
                            $flat<{id: NodeId<any>}>(),
                            $map(({id}) => id),
                            $head(),
                        ),
                    ),
                    $filterPick(1, (id): id is NodeId<any> => !!id),
                    asImmutableMap(),
                );

                const dependencies = $pipe(
                    createImmutableList(createDependencyArray(paramMap)),
                    $map(id => {
                      const sourceNode = $pipe(sourceIdToNodeMap, $getKey(id), $pick(1), $head());
                      const streamNode = $pipe(streamIdToNodeMap, $getKey(id), $pick(1), $head());
                      if (!sourceNode && !streamNode) {
                        throw new Error(`No nodes found for ${id}`);
                      }

                      return sourceNode || streamNode;
                    }),
                    $filter((node): node is StaticStreamNode<any>|InstanceStreamNode<any> => {
                      return !!node;
                    }),
                    asImmutableList(),
                );

                const node = new InstanceStreamNode(
                    dependencies,
                    function(this: any, ...args: any[]): Observable<any> {
                      return this[key](...args);
                    },
                );

                return [key, node] as [string|symbol, StreamNode<any>];
              },
            ),
        );
        const nonVineOutMap: ImmutableMap<string|symbol, StreamNode<any>> = $pipe(
            attachedValues,
            asImmutableMap(),
        );

        return [
          ctor,
          createImmutableMap<string|symbol, StreamNode<any>>([...vineOutMap, ...nonVineOutMap]),
        ] as [Function, ImmutableMap<string|symbol, StreamNode<any>>];
      }),
      declareKeyed(([key]) => key),
      asImmutableMap<Function, ImmutableMap<string|symbol, StreamNode<any>>>(),
  );
}

function sortRegistrationMap(
    registrationMap: ImmutableMap<StreamId<any>, StreamRegistrationNode<any>>,
): Array<[StreamId<any>, StreamRegistrationNode<any>]> {
  // Create the graph.
  const potentialRoots = new Set($pipe(registrationMap, $keys())());
  const treeNodes = new Map<StreamId<any>, StreamTreeNode>();
  for (const [id, registration] of registrationMap) {
    const parent = treeNodes.get(id) || {children: new Set(), parents: new Set(), value: id};

    // Add the dependencies.
    for (const childId of registration.dependencies()) {
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

    const registration = $pipe(registrationMap, $getKey(rootId), $pick(1), $head());
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
