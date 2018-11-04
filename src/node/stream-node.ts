import { InstanceStreamNode } from './instance-stream-node';
import { StaticStreamNode } from './static-stream-node';

export type StreamNode<T> = InstanceStreamNode<T>|StaticStreamNode<T>;
