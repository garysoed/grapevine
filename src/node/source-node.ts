import { InstanceSourceNode } from './instance-source-node';
import { StaticSourceNode } from './static-source-node';

export type SourceNode<T> = InstanceSourceNode<T>|StaticSourceNode<T>;
