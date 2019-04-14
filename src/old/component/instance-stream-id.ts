import { Type } from 'gs-types/export';
import { NodeId } from './node-id';

/**
 * Identifies an instance stream node.
 */
export class InstanceStreamId<T> extends NodeId<T> {
  readonly nodeType: 'instanceStream' = 'instanceStream';

  constructor(debug: string, type: Type<T>) {
    super(debug, type);
  }

  toString(): string {
    return `InstanceStreamId(${this.debug_})`;
  }
}

export function instanceStreamId<T>(debug: string, type: Type<T>): InstanceStreamId<T> {
  return new InstanceStreamId(debug, type);
}
