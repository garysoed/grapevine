import { Annotations } from 'gs-tools/export/data';
import { NodeId } from '../component/node-id';

/**
 * Data for the arguments of a @vineOut annotated method.
 */
interface Data {
  id: NodeId<any>;
  index: number;
}
export const ANNOTATIONS: Annotations<Data> = Annotations.of<Data>(Symbol('vineIn'));

/**
 * Annotates an argument in a @vineOut annotated method.
 *
 * @param id ID of the Vine node to inject in this space.
 */
export function vineIn(id: NodeId<any>): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol, index: number) => {
    ANNOTATIONS.forCtor(target.constructor)
        .attachValueToProperty(propertyKey, {index, id});
  };
}
