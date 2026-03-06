import { FEATURE_FLAG_STATUS, FILTER_MODE } from 'upgrade_types';

export const featureFlag = {
  id: '110c0200-7a15-4e19-8688-f9ac283f18aa',
  name: 'FF test 1',
  key: 'FF-TEST',
  description: '',
  status: FEATURE_FLAG_STATUS.ENABLED,
  context: ['home'],
  tags: [],
  filterMode: FILTER_MODE.INCLUDE_ALL,
};
