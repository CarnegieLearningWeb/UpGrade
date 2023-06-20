import { MOCK_APP_NAMES } from '../../shared/constants.js';
import { HookRequestBody, HookResponse } from '../../shared/models.js';
// import { availableBackendMockApps } from './app-config.js';
import { GeneralTSBackendVersion5 } from './mockBackendTSServerApps/GeneralTSBackendVersion5.js';
// import BirthdayApp from './mockBackendTSServerApps/BirthdayApp.js';

export default async function (clientConstructor: any, hookRequest: HookRequestBody): Promise<HookResponse> {
  const { mockApp } = hookRequest;

  if (mockApp === MOCK_APP_NAMES.GENERAL_TS_BACKEND_5) {
    return new GeneralTSBackendVersion5(clientConstructor).routeHook(hookRequest);
  } else {
    return {
      hookReceived: hookRequest,
      response: {
        error: `No mock app found for ${mockApp}`,
      },
    };
  }
}
