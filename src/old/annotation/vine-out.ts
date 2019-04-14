import { ClassAnnotator, PropertyAnnotator } from '@gs-tools/data';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';

interface VineOutWithForwardingData {
  inId: NodeId<any>;
  outId: NodeId<any>;
}

interface VineOutDecorator<T> extends PropertyDecorator {
  withForwarding(input: NodeId<T>): ClassDecorator;
}

export type VineOut = <T>(instanceId: InstanceStreamId<T>) => VineOutDecorator<T>;

export function vineOutFactory(
    vineOutAnnotator: PropertyAnnotator<{id: InstanceStreamId<any>}, [InstanceStreamId<any>]>,
    vineOutWithForwardingAnnotator: ClassAnnotator<
        VineOutWithForwardingData, [NodeId<any>, InstanceStreamId<any>]>,
): VineOut {
  return <T>(instanceId: InstanceStreamId<T>) => {
    const forwarding = {
      withForwarding(input: NodeId<T>): ClassDecorator {
        return vineOutWithForwardingAnnotator.decorator(input, instanceId);
      },
    };

    // tslint:disable-next-line:prefer-object-spread
    return Object.assign(vineOutAnnotator.decorator(instanceId), forwarding);
  };
}
