import { BaseDisposable } from '@gs-tools/dispose';

export type InstanceSourceProvider<T> = (context: BaseDisposable) => T;
