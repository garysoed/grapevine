import { Type } from 'gs-types/export';
import { NodeId } from './node-id';

/**
 * Identifies a static stream node.
 */
export class StaticStreamId<T> extends NodeId<T> {
  readonly nodeType: 'staticStream' = 'staticStream';

  constructor(debug: string, type: Type<T>) {
    super(debug, type);
  }

  toString(): string {
    return `StaticStreamId(${this.debug_})`;
  }
}

export function staticStreamId<T>(debug: string, type: Type<T>): StaticStreamId<T> {
  return new StaticStreamId(debug, type);
}
