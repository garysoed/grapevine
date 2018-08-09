import 'jasmine';

import { assert, match, should } from 'gs-testing/export/main';
import { Mocks, MockTime } from 'gs-testing/export/mock';
import { createSpy } from 'gs-testing/export/spy';
import { Time } from '../component/time';
import { SourceNode } from '../node/source-node';
import { RequestQueue } from './request-queue';

describe('main.RequestQueue', () => {
  let initTime: Time;
  let mockTime: MockTime;
  let queue: RequestQueue;

  beforeEach(() => {
    initTime = Time.new();
    mockTime = new MockTime();

    queue = new RequestQueue(initTime, mockTime.createWindow());
  });

  describe('queue', () => {
    should(`queue and process the requests correctly`, async () => {
      const mockKey1 = Mocks.object<SourceNode<unknown>>('key1');
      const mockKey2 = Mocks.object<SourceNode<unknown>>('key2');
      const mockKey3 = Mocks.object<SourceNode<unknown>>('key3');

      const mockRequest1 = createSpy('Request1');
      const mockRequest2 = createSpy('Request2');
      const mockRequest3 = createSpy('Request3');

      mockTime.at(0, () => {
        queue.queue(mockKey1, mockRequest1);
        queue.queue(mockKey2, mockRequest2);
      });
      mockTime.at(2, () => {
        queue.queue(mockKey3, mockRequest3);
      });

      let time1: Time;
      mockTime.at(1, () => {
        const timeMatcher = match.anyThat<Time>().beAnInstanceOf(Time);
        assert(mockRequest1).to.haveBeenCalledWith(timeMatcher);
        time1 = timeMatcher.getLastMatch();
        assert(initTime.before(time1)).to.beTrue();
        assert(mockRequest2).to.haveBeenCalledWith(time1);
        assert(mockRequest3).toNot.haveBeenCalled();
      });

      mockTime.at(3, () => {
        const timeMatcher = match.anyThat<Time>().beAnInstanceOf(Time);
        assert(mockRequest3).to.haveBeenCalledWith(timeMatcher);
        const time2 = timeMatcher.getLastMatch();
        assert(time1.before(time2)).to.beTrue();
      });

      await mockTime.run();
    });
  });
});
