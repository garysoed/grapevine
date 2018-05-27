import 'jasmine';

import { assert } from 'gs-testing/export/main';
import { MockTime } from 'gs-testing/export/mock';
import { Time } from '../component/time';
import { RequestQueue } from './request-queue';

describe('main.RequestQueue', () => {
  let initTime: Time;
  let mockTime: MockTime;
  let queue: RequestQueue;

  beforeEach(() => {
    initTime = Time.new();
    mockTime = new MockTime();
    mockTime.inject(window);

    queue = new RequestQueue(initTime);
  });

  describe('queue', () => {
    it(`should queue and process the requests correctly`, () => {
      const mockRequest1 = jasmine.createSpy('Request1');
      const mockRequest2 = jasmine.createSpy('Request2');
      const mockRequest3 = jasmine.createSpy('Request3');

      mockTime.at(0, () => {
        queue.queue(mockRequest1);
        queue.queue(mockRequest2);
      });
      mockTime.at(2, () => {
        queue.queue(mockRequest3);
      });

      let time1: Time;
      mockTime.at(1, () => {
        time1 = mockRequest1.calls.argsFor(0)[0];
        assert(initTime.before(time1)).to.beTrue();
        assert(mockRequest1).to.haveBeenCalledWith(time1);
        assert(mockRequest2).to.haveBeenCalledWith(time1);
        assert(mockRequest3).toNot.haveBeenCalled();
      });

      mockTime.at(3, () => {
        const time2 = mockRequest3.calls.argsFor(0)[0];
        assert(time1.before(time2)).to.beTrue();
        assert(mockRequest3).to.haveBeenCalledWith(time2);
      });

      mockTime.run();
    });
  });
});
