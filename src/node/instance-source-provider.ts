import { BaseDisposable } from 'gs-tools/export/dispose';

export type InstanceSourceProvider<T> = (context: BaseDisposable) => Promise<T>|T;
