import { ClassAnnotator, ParameterAnnotator, PropertyAnnotator } from 'gs-tools/export/data';
import { VineOut, vineOutFactory } from '../annotation/vine-out';
import { InstanceStreamId } from '../component/instance-stream-id';
import { NodeId } from '../component/node-id';
import { VineBuilder } from './vine-builder';

/**
 * Represents handlers for a Grapevine app.
 */
export interface VineApp {
  builder: VineBuilder;
  vineOut: VineOut;
  vineIn(id: NodeId<any>): ParameterDecorator;
}

const apps = new Map<string, VineApp>();

/**
 * Gets or register a Grapevine app.
 */
export function getOrRegisterApp(appName: string): VineApp {
  const createdApp = apps.get(appName);
  if (createdApp) {
    return createdApp;
  }

  const vineInAnnotator = new ParameterAnnotator((_0, _1, _2, id: NodeId<any>) => ({id}));
  const vineOutAnnotator = new PropertyAnnotator((_0, _1, id: InstanceStreamId<any>) => ({id}));
  const vineOutWithForwardingAnnotator = new ClassAnnotator(
      (_0, inId: NodeId<any>, outId: InstanceStreamId<any>) => ({
        data: {inId, outId},
        newTarget: undefined,
      }));

  const builder = new VineBuilder(
      vineInAnnotator,
      vineOutAnnotator,
      vineOutWithForwardingAnnotator,
  );
  const vineIn = vineInAnnotator.decorator;
  const newApp = {
    builder,
    vineIn,
    vineOut: vineOutFactory(vineOutAnnotator, vineOutWithForwardingAnnotator),
  };
  apps.set(appName, newApp);

  return newApp;
}

export function clearApps(): void {
  apps.clear();
}
