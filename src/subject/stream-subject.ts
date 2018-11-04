import { InstanceStreamSubject } from './instance-stream-subject';
import { StaticStreamSubject } from './static-stream-subject';

export type StreamSubject<T> = InstanceStreamSubject<T>|StaticStreamSubject<T>;
