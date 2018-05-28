import { Errors } from 'gs-tools/export/error';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { getBuilder } from '../main/vine';
import { ANNOTATIONS } from './vine-in';

/**
 * Annotates a method as a stream node.
 * @param instanceId Stream ID for this node.
 */
export function vineOut(instanceId: InstanceStreamId<any>): MethodDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const paramsSet = ANNOTATIONS
        .forCtor(target.constructor)
        .getAttachedValues()
        .get(propertyKey);

    const paramsArray: NodeId<any>[] = [];
    for (const {index, id} of paramsSet || []) {
      paramsArray[index] = id;
    }

    const handler = (target as any)[propertyKey];
    if (!(handler instanceof Function)) {
      throw Errors.assert(`Type of ${target.constructor.name}.${propertyKey}`)
          .shouldBe('a function')
          .butWas(handler);
    }

    getBuilder().stream_(instanceId, handler, ...paramsArray);
  };
}
