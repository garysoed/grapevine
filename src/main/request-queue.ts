import { BaseDisposable } from 'gs-tools/export/dispose';
import { Time } from '../component/time';
import { SourceNode } from '../node/source-node';

type SetRequest = (time: Time) => void;

/**
 * Queue that batches requests and processes them asynchronously.
 */
export class RequestQueue extends BaseDisposable {
  private readonly requests_: Map<SourceNode<unknown>, SetRequest> = new Map();
  private timerId_: number|null = null;

  constructor(
      private time_: Time,
      private readonly window_: Window = window) {
    super();
  }

  private flushQueue_(): void {
    const time = this.time_.increment();
    this.time_ = time;

    for (const [, request] of this.requests_) {
      request(time);
    }

    this.requests_.clear();
    this.timerId_ = null;
  }

  getTime(): Time {
    return this.time_;
  }

  queue(key: SourceNode<unknown>, request: SetRequest): void {
    this.requests_.set(key, request);
    if (this.timerId_ === null) {
      this.timerId_ = this.window_.setTimeout(() => this.flushQueue_(), 0);
    }
  }
}
