import { HookRequestBody } from '../../shared/models.js';
import { availableMockApps } from './app-config.js';
import BirthdayApp from './mockBackendTSServerApps/BirthdayApp.js';

export default function (clientConstructor: any, hookRequest: HookRequestBody) {
  const { mockApp } = hookRequest;

  if (mockApp === availableMockApps.BDAY_APP_BACKEND) {
    return BirthdayApp();
  } else {
    return `No mock app found with the name ${mockApp}`;
  }
}
