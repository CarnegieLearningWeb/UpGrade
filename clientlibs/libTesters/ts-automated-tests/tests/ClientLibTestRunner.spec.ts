import { MOCK_APP_NAMES } from '../../shared/constants.js';
import { HookRequestBody } from '../../shared/models.js';
import routeHookToMockApp from '../../ts-lib-tester-backend-server/src/routeHookToMockApp';
import { getUpgradeClientConstructor, validateHook } from '../../ts-lib-tester-backend-server/src/utils.js';

describe('ClientLibTestRunner', () => {
  it('can load the test runner', () => {
    expect(true).toBe(true);
  });

  it('can find the v4 test spec via routehook', () => {
    const hookRequest: HookRequestBody = {
      mockApp: MOCK_APP_NAMES.GENERAL_TS_BACKEND_4,
      libVersion: '4.1.6',
      name: 'init',
      user: {
        id: '123',
        groups: { group1: ['group1id'] },
        workingGroup: {
          group1: 'group1id',
        },
        userAliases: ['alias1'],
      },
      apiHostUrl: 'http://localhost:3000',
    };

    const ClientLibConstructor = getUpgradeClientConstructor(hookRequest.libVersion);

    console.log('ClientLibConstructor', ClientLibConstructor);

    // route to mock app with the client constructor, payload, and hook
    console.log('hookRequest', hookRequest);

    const response = await routeHookToMockApp(ClientLibConstructor, hookRequest);
  });
});
