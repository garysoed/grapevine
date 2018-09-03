import { BaseDisposable } from 'gs-tools/export/dispose';
import { Time } from '../component/time';
import { SourceNode } from '../node/source-node';

type SetRequest = (time: Time) => void;

/**
 * Queue that batches requests and processes them asynchronously.
 */
export class RequestQueue extends BaseDisposable {
  private readonly requests_: Map<SourceNode<unknown>, Map<BaseDisposable, SetRequest>> = new Map();
  private timerId_: number|null = null;

  constructor(
      private time_: Time,
      private readonly window_: Window = window) {
    super();
  }

  private flushQueue_(): void {
    const time = this.time_.increment();
    this.time_ = time;

    for (const [, contextMap] of this.requests_) {
      for (const [, request] of contextMap) {
        request(time);
      }
    }

    this.requests_.clear();
    this.timerId_ = null;
  }

  getTime(): Time {
    return this.time_;
  }

  queue(key: SourceNode<unknown>, context: BaseDisposable, request: SetRequest): void {
    const contextMap = this.requests_.get(key) || new Map<BaseDisposable, SetRequest>();
    contextMap.set(context, request);
    this.requests_.set(key, contextMap);
    if (this.timerId_ === null) {
      this.timerId_ = this.window_.setTimeout(() => this.flushQueue_(), 0);
    }
  }
}
