import { InstanceSourceId } from './instance-source-id';
import { StaticSourceId } from './static-source-id';

export type SourceId<T> = InstanceSourceId<T> | StaticSourceId<T>;
