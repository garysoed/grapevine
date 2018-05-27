import { InstanceStreamId } from './instance-stream-id';
import { StaticStreamId } from './static-stream-id';

export type StreamId<T> = StaticStreamId<T> | InstanceStreamId<T>;
