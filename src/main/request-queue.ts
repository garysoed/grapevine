import { BaseDisposable } from 'gs-tools/export/dispose';
import { Time } from '../component/time';

type SetRequest = (time: Time) => void;

/**
 * Queue that batches requests and processes them asynchronously.
 */
export class RequestQueue extends BaseDisposable {
  private readonly requests_: SetRequest[] = [];
  private timerId_: number|null = null;

  constructor(
      private time_: Time,
      private readonly window_: Window = window) {
    super();
  }

  private flushQueue_(): void {
    const time = this.time_.increment();
    this.time_ = time;

    for (const request of this.requests_) {
      request(time);
    }

    this.requests_.splice(0, this.requests_.length);
    this.timerId_ = null;
  }

  getTime(): Time {
    return this.time_;
  }

  queue(request: SetRequest): void {
    this.requests_.push(request);
    if (this.timerId_ === null) {
      this.timerId_ = this.window_.setTimeout(() => this.flushQueue_(), 0);
    }
  }
}
