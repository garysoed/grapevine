import { Annotations } from 'gs-tools/export/data';
import { NodeId } from '../component/node-id';

/**
 * Data for the arguments of a @vineOut annotated method.
 */
export interface VineInData {
  id: NodeId<any>;
  index: number;
}

export type VineIn = (id: NodeId<any>) => ParameterDecorator;

export function vineInFactory(annotationsCache: Annotations<VineInData>): VineIn {
  return (id: NodeId<any>) => {
    return (target: Object, propertyKey: string | symbol, index: number) => {
      annotationsCache.forCtor(target.constructor)
          .attachValueToProperty(propertyKey, {index, id});
    };
  };
}
