import { Annotations } from 'gs-tools/export/data';
import { Errors } from 'gs-tools/export/error';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { VineBuilder } from '../main/vine-builder';
import { VineInData } from './vine-in';

export type VineOut = (instanceId: InstanceStreamId<any>) => PropertyDecorator;

export function vineOutFactory(
    annotationsCache: Annotations<VineInData>,
    vineBuilder: VineBuilder): VineOut {
  return (instanceId: InstanceStreamId<any>) => {
    return (target: Object, propertyKey: string | symbol) => {
      const paramsSet = annotationsCache
          .forCtor(target.constructor)
          .getAttachedValues()
          .get(propertyKey);

      const paramsArray: NodeId<any>[] = [];
      for (const {index, id} of paramsSet || []) {
        paramsArray[index] = id;
      }

      // tslint:disable-next-line:typedef
      const handler = (target as any)[propertyKey] || function(this: any) {
        return this[propertyKey];
      };
      if (!(handler instanceof Function)) {
        throw Errors.assert(`Type of ${target.constructor.name}.${propertyKey.toString()}`)
            .shouldBe('a function')
            .butWas(handler);
      }

      vineBuilder.stream_(instanceId, handler, ...paramsArray);
    };
  };
}
