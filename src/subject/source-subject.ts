import { InstanceSourceSubject } from './instance-source-subject';
import { StaticSourceSubject } from './static-source-subject';

export type SourceSubject<T> = InstanceSourceSubject<T>|StaticSourceSubject<T>;
