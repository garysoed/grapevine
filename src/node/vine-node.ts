import { ImmutableSet } from 'gs-tools/export/collect';
import { NodeId } from '../component/node-id';
import { Time } from '../component/time';
import { NodeCache } from './node-cache';
import { SourceNode } from './source-node';

/**
 * Base class for all nodes in Grapevine.
 */
export abstract class VineNode<T> {
  protected readonly nodeCache_: NodeCache<T>;

  constructor(
      protected readonly initTime_: Time,
      protected readonly id_: NodeId<T>) {
    this.nodeCache_ = new NodeCache();
  }

  getId(): NodeId<T> {
    return this.id_;
  }

  abstract getSources(): ImmutableSet<SourceNode<any>>;
}
