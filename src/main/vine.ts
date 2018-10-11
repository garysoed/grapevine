import { Annotations } from 'gs-tools/export/data';
import { VineIn, VineInData, vineInFactory } from '../annotation/vine-in';
import { VineOut, vineOutFactory } from '../annotation/vine-out';
import { VineBuilder } from './vine-builder';

/**
 * Represents handlers for a Grapevine app.
 */
export interface VineApp {
  builder: VineBuilder;
  vineIn: VineIn;
  vineOut: VineOut;
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

  const annotationsCache = new Annotations<VineInData>(Symbol(appName));
  const builder = new VineBuilder();
  const vineIn = vineInFactory(annotationsCache);
  const vineOut = vineOutFactory(annotationsCache, builder, vineIn);
  const newApp = {
    builder,
    vineIn,
    vineOut,
  };
  apps.set(appName, newApp);

  return newApp;
}
