import { BehaviorSubject } from 'rxjs';
import { FeatureFlagsService } from './feature-flags.service';
import * as FeatureFlagSelectors from './store/feature-flags.selectors';
import * as FeatureFlagsActions from './store/feature-flags.actions';
import { FeatureFlag, FLAG_SEARCH_SORT_KEY, SORT_AS, UpsertFeatureFlagType } from './store/feature-flags.model';
import { fakeAsync, tick } from '@angular/core/testing';
import { isEmpty } from 'rxjs/operators';

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

describe('FeatureFlagService', () => {
  let mockStore: any;
  let service: FeatureFlagsService;
  const mockFeatureFlagsList: FeatureFlag[] = [
    {
      createdAt: '04/23/17 04:34:22 +0000',
      updatedAt: 'abc123',
      versionNumber: 5,
      id: 'flag1',
      name: 'flag1',
      key: 'flag1',
      description: 'flag1',
      variationType: 'abc123',
      status: true,
      variations: [],
    },
    {
      createdAt: '04/25/17 04:34:22 +0000',
      updatedAt: 'abc123',
      versionNumber: 5,
      id: 'flag2',
      name: 'flag2',
      key: 'flag2',
      description: 'flag2',
      variationType: 'abc123',
      status: true,
      variations: [],
    },
    {
      createdAt: '04/24/17 04:34:22 +0000',
      updatedAt: 'abc123',
      versionNumber: 5,
      id: 'flag3',
      name: 'flag3',
      key: 'flag3',
      description: 'flag3',
      variationType: 'abc123',
      status: true,
      variations: [],
    },
    {
      createdAt: '04/24/17 04:34:22 +0000',
      updatedAt: 'abc123',
      versionNumber: 5,
      id: 'flag4',
      name: 'flag4',
      key: 'flag4',
      description: 'flag4',
      variationType: 'abc123',
      status: true,
      variations: [],
    },
  ];
  const mockFeatureFlag = mockFeatureFlagsList[0];

  beforeEach(() => {
    mockStore = MockStateStore$;
    service = new FeatureFlagsService(mockStore);
  });

  describe('#allFeatureFlags$', () => {
    it('should return sorted list of the featureFlags', fakeAsync(() => {
      const expectedValue = [...mockFeatureFlagsList][1];

      FeatureFlagSelectors.selectAllFeatureFlags.setResult([...mockFeatureFlagsList]);

      service.allFeatureFlags$.subscribe((val) => {
        tick(0);
        expect(val[0]).toEqual(expectedValue);
      });
    }));

    it('should not emit anything if selectedFeatureFlags returns a falsey value', fakeAsync(() => {
      const expectedValue = true;

      FeatureFlagSelectors.selectAllFeatureFlags.setResult(null);

      service.allFeatureFlags$.pipe(isEmpty()).subscribe((val) => {
        tick(0);
        expect(val).toEqual(expectedValue);
      });
    }));
  });

  describe('#allFlagsKeys$', () => {
    it('should return a map of all feaureFlag keys', fakeAsync(() => {
      const expectedValue = ['flag1', 'flag2', 'flag3', 'flag4'];

      FeatureFlagSelectors.selectAllFeatureFlags.setResult([...mockFeatureFlagsList]);

      service.allFlagsKeys$.subscribe((val) => {
        tick(0);
        expect(val).toEqual(expectedValue);
      });
    }));
  });

  describe('#isInitialFeatureFlagsLoading', () => {
    const testCases = [
      {
        whenCondition: 'is NOT in loadingstate AND has featureFlags',
        expectedValue: true,
        isLoading: false,
        featureFlags: mockFeatureFlagsList,
      },
      {
        whenCondition: 'is NOT loading AND has NO featureFlags',
        expectedValue: true,
        isLoading: false,
        featureFlags: [],
      },
      {
        whenCondition: 'is loading AND has NO featureFlags',
        expectedValue: false,
        isLoading: true,
        featureFlags: [],
      },
      {
        whenCondition: 'is loading AND has featureFlags',
        expectedValue: true,
        isLoading: true,
        featureFlags: mockFeatureFlagsList,
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, isLoading, featureFlags } = testCase;

      it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
        FeatureFlagSelectors.selectIsLoadingFeatureFlags.setResult(isLoading);
        FeatureFlagSelectors.selectAllFeatureFlags.setResult(featureFlags);

        service.isInitialFeatureFlagsLoading().subscribe((val) => {
          tick(0);
          expect(val).toBe(expectedValue);
        });
      }));
    });
  });

  describe('#isAllFlagsFetched', () => {
    const testCases = [
      {
        whenCondition: 'skip does not equal total',
        expectedValue: false,
        skipFlags: 0,
        totalFlags: 1,
      },
      {
        whenCondition: 'skip does equal total',
        expectedValue: true,
        skipFlags: 1,
        totalFlags: 1,
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, skipFlags, totalFlags } = testCase;

      it(`WHEN ${whenCondition}, THEN ${expectedValue}:`, fakeAsync(() => {
        FeatureFlagSelectors.selectSkipFlags.setResult(skipFlags);
        FeatureFlagSelectors.selectTotalFlags.setResult(totalFlags);

        service.isAllFlagsFetched().subscribe((val) => {
          tick(0);
          expect(val).toEqual(expectedValue);
        });
      }));
    });
  });

  describe('#fetchFeatureFlags', () => {
    it('should dispatch actionFetchFeatureFlags with the given input', () => {
      const fromStarting = true;

      service.fetchFeatureFlags(fromStarting);

      expect(mockStore.dispatch).toHaveBeenCalledWith(FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting }));
    });

    it('should dispatch actionFetchFeatureFlags without the given input', () => {
      service.fetchFeatureFlags();

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        FeatureFlagsActions.actionFetchFeatureFlags({ fromStarting: undefined })
      );
    });
  });

  describe('#createNewFeatureFlag', () => {
    it('should dispatch actionUpsertFeatureFlag with the given input', () => {
      const flag = { ...mockFeatureFlag };

      service.createNewFeatureFlag(flag);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        FeatureFlagsActions.actionUpsertFeatureFlag({ flag, actionType: UpsertFeatureFlagType.CREATE_NEW_FLAG })
      );
    });
  });

  describe('#updateFeatureFlagStatus', () => {
    it('should dispatch actionUpdateFlagStatus with the given input', () => {
      const flagId = 'abc123';
      const status = false;

      service.updateFeatureFlagStatus(flagId, status);

      expect(mockStore.dispatch).toHaveBeenCalledWith(FeatureFlagsActions.actionUpdateFlagStatus({ flagId, status }));
    });
  });

  describe('#deleteFeatureFlag', () => {
    it('should dispatch actionFetchFeatureFlags with the given input', () => {
      const flagId = 'abc123';

      service.deleteFeatureFlag(flagId);

      expect(mockStore.dispatch).toHaveBeenCalledWith(FeatureFlagsActions.actionDeleteFeatureFlag({ flagId }));
    });
  });

  describe('#updateFeatureFlag', () => {
    it('should dispatch actionUpsertFeatureFlag without the given input', () => {
      const flag = { ...mockFeatureFlag };

      service.updateFeatureFlag(flag);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        FeatureFlagsActions.actionUpsertFeatureFlag({ flag, actionType: UpsertFeatureFlagType.UPDATE_FLAG })
      );
    });
  });

  describe('#getActiveVariation', () => {
    const flagVariantFalse = {
      createdAt: 'test',
      updatedAt: 'test',
      versionNumber: 1,
      id: 'flagVarFalse',
      value: 'flagVarFalse',
      name: 'flagVarFalse',
      description: 'flagVarFalse',
      defaultVariation: [false],
    };
    const flagVariantTrue = {
      createdAt: 'test',
      updatedAt: 'test',
      versionNumber: 1,
      id: 'flagVarTrue',
      value: 'flagVarTrue',
      name: 'flagVarTrue',
      description: 'flagVarTrue',
      defaultVariation: [true],
    };
    const testCases = [
      {
        whenCondition: 'no variations, type is undefined, and flag.status is false',
        expectedValue: '',
        flag: { ...mockFeatureFlag, variations: [], status: false },
        type: undefined,
      },
      {
        whenCondition: 'no variations, type is undefined, and flag.status is true',
        expectedValue: '',
        flag: { ...mockFeatureFlag, variations: [], status: true },
        type: undefined,
      },
      {
        whenCondition: 'no variations, type is true, and flag.status is false',
        expectedValue: '',
        flag: { ...mockFeatureFlag, variations: [], status: false },
        type: true,
      },
      {
        whenCondition: 'no variations, type is false, and status is true',
        expectedValue: '',
        flag: { ...mockFeatureFlag, variations: [], status: true },
        type: false,
      },
      {
        whenCondition: 'variant status false, flag status is true, type is true',
        expectedValue: '',
        flag: {
          ...mockFeatureFlag,
          variations: [
            {
              ...flagVariantFalse,
            },
          ],
          status: true,
        },
        type: true,
      },
      {
        whenCondition: 'variant status true, flag status is true, type is true',
        expectedValue: 'flagVarTrue',
        flag: {
          ...mockFeatureFlag,
          variations: [
            {
              ...flagVariantTrue,
            },
          ],
          status: true,
        },
        type: true,
      },
      {
        whenCondition: 'variant status true, flag status is true, type is undefined',
        expectedValue: 'flagVarTrue',
        flag: {
          ...mockFeatureFlag,
          variations: [
            {
              ...flagVariantTrue,
            },
          ],
          status: true,
        },
        type: true,
      },
      {
        whenCondition: 'variant status false, flag status is false, type is false',
        expectedValue: 'flagVarFalse',
        flag: {
          ...mockFeatureFlag,
          variations: [
            {
              ...flagVariantFalse,
            },
          ],
          status: false,
        },
        type: false,
      },
    ];

    testCases.forEach((testCase) => {
      const { whenCondition, expectedValue, flag, type } = testCase;
      it(`WHEN ${whenCondition}, THEN, ${expectedValue}:`, () => {
        const result = service.getActiveVariation(flag, type);

        expect(result).toBe(expectedValue);
      });
    });
  });

  describe('#setSearchKey', () => {
    it('should dispatch actionSetSearchKey with the given input', () => {
      const searchKey = FLAG_SEARCH_SORT_KEY.ALL;

      service.setSearchKey(searchKey);

      expect(mockStore.dispatch).toHaveBeenCalledWith(FeatureFlagsActions.actionSetSearchKey({ searchKey }));
    });
  });

  describe('#setSearchString', () => {
    it('should dispatch actionSetSearchKey with the given input', () => {
      const searchString = 'test';

      service.setSearchString(searchString);

      expect(mockStore.dispatch).toHaveBeenCalledWith(FeatureFlagsActions.actionSetSearchString({ searchString }));
    });
  });

  describe('#setSortKey', () => {
    it('should dispatch actionSetSortKey with the given input', () => {
      const sortKey = FLAG_SEARCH_SORT_KEY.ALL;

      service.setSortKey(sortKey);

      expect(mockStore.dispatch).toHaveBeenCalledWith(FeatureFlagsActions.actionSetSortKey({ sortKey }));
    });
  });

  describe('#setSortingType', () => {
    it('should dispatch actionSetSortingType with the given input', () => {
      const sortingType = SORT_AS.ASCENDING;

      service.setSortingType(sortingType);

      expect(mockStore.dispatch).toHaveBeenCalledWith(FeatureFlagsActions.actionSetSortingType({ sortingType }));
    });
  });
});
