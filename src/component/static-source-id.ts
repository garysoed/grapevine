import { Type } from 'gs-types/export';
import { NodeId } from './node-id';

/**
 * Identifies a static source node.
 */
export class StaticSourceId<T> extends NodeId<T> {
  readonly nodeType: 'staticSource' = 'staticSource';

  constructor(debug: string, type: Type<T>) {
    super(debug, type);
  }

  toString(): string {
    return `StaticSourceId(${this.debug_})`;
  }
}

export function staticSourceId<T>(debug: string, type: Type<T>): StaticSourceId<T> {
  return new StaticSourceId(debug, type);
}
