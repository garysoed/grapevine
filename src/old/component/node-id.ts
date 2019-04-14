import { Type } from 'gs-types/export';

/**
 * Identifies a node in grapevine.
 */
export abstract class NodeId<T> {
  constructor(
      protected readonly debug_: string,
      private readonly type_: Type<T>) { }

  getType(): Type<T> {
    return this.type_;
  }

  toString(): string {
    return `NodeId(${this.debug_})`;
  }
}
