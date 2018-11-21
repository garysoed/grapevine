import { Annotations } from 'gs-tools/export/data';
import { Errors } from 'gs-tools/export/error';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { VineBuilder } from '../main/vine-builder';
import { VineIn, VineInData } from './vine-in';

interface VineOutDecorator<T> extends PropertyDecorator {
  withForwarding(input: NodeId<T>): ClassDecorator;
}

export type VineOut = <T>(instanceId: InstanceStreamId<T>) => VineOutDecorator<T>;

export function vineOutFactory(
    annotationsCache: Annotations<VineInData>,
    vineBuilder: VineBuilder,
    vineIn: VineIn,
): VineOut {
  return <T>(instanceId: InstanceStreamId<T>) => {
    const decorator = (target: Object, propertyKey: string | symbol) => {
      const paramsSet = annotationsCache
          .forCtor(target.constructor)
          .getAttachedValues()
          .get(propertyKey);

      const paramsArray: Array<NodeId<any>> = [];
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

    const forwarding = {
      withForwarding(input: NodeId<T>): ClassDecorator {
        return (target: Function) => {
          const key = Symbol(`$forwarding: ${input} to ${instanceId}`);
          Object.defineProperty(target.prototype, key, {
            value: (v: T) => v,
          });
          decorator(target.prototype, key);
          vineIn(input)(target.prototype, key, 0);
        };
      },
    };

    // tslint:disable-next-line:prefer-object-spread
    return Object.assign(decorator, forwarding);
  };
}
