import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Environment } from '../../../environments/environment-types';
import { TitleService } from './title.service';

class MockTranslateService {
  get = () => {
    return;
  };
}

class MockTitle {
  setTitle = jest.fn();
}

describe('TitleService', () => {
  let mockTranslateService: any;
  let mockTitle: any;
  const mockEnvironment: Environment = { ...environment };
  let service: TitleService;

  beforeEach(() => {
    mockTranslateService = new MockTranslateService();
    mockTitle = new MockTitle();
    service = new TitleService(mockTranslateService, mockTitle, mockEnvironment);
  });

  describe('#setTitle', () => {
    const testCases = [
      {
        whenCondition: 'snapshot is valid and title does NOT match the translated title',
        expectedValue: mockEnvironment.appName + ' - bambino',
        mockTranslatedTitle: 'bambino',
        snapshot: {
          children: [
            {
              children: [],
              data: { title: 'child' },
            },
          ],
          data: { title: 'root' },
        },
      },
      {
        whenCondition: 'snapshot has no title data',
        expectedValue: mockEnvironment.appName,
        mockTranslatedTitle: null,
        snapshot: {
          children: [
            {
              children: [],
              data: { title: undefined },
            },
          ],
          data: { title: 'root' },
        },
      },
      {
        whenCondition: 'title will not get set if translated title matches title data',
        expectedValue: mockEnvironment.appName,
        mockTranslatedTitle: 'child',
        snapshot: {
          children: [
            {
              children: [],
              data: { title: 'child' },
            },
          ],
          data: { title: 'root' },
        },
      },
    ];

    testCases.forEach(({ whenCondition, expectedValue, mockTranslatedTitle, snapshot }) => {
      it(`WHEN ${whenCondition}, THEN the expected value is ${expectedValue}`, fakeAsync(() => {
        mockTranslateService.get = jest.fn().mockReturnValue(of(mockTranslatedTitle));

        service.setTitle(snapshot as any);

        tick(0);

        if (mockTranslatedTitle === 'child') {
          expect(mockTitle.setTitle).not.toHaveBeenCalled();
        } else {
          expect(mockTitle.setTitle).toHaveBeenCalledWith(expectedValue);
        }
      }));
    });
  });
});
