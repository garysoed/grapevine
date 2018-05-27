import { Type } from 'gs-types/export';
import { NodeId } from './node-id';

/**
 * Identifies an instance source node.
 */
export class InstanceSourceId<T> extends NodeId<T> {
  readonly nodeType: 'instanceSource' = 'instanceSource';

  constructor(debug: string, type: Type<T>) {
    super(debug, type);
  }

  toString(): string {
    return `InstanceSourceId(${this.debug_})`;
  }
}

export function instanceSourceId<T>(debug: string, type: Type<T>): InstanceSourceId<T> {
  return new InstanceSourceId(debug, type);
}
