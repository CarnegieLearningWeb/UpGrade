import { UpgradeClient as UpgradeClient_1_1_17 } from 'upgrade_client_1_1_17';
import { UpgradeClient as UpgradeClient_3_0_18 } from 'upgrade_client_3_0_18';
import { UpgradeClient as UpgradeClient_4_2_0 } from 'upgrade_client_4_2_0';

export declare type UpgradeClient = UpgradeClient_1_1_17 | UpgradeClient_3_0_18 | UpgradeClient_4_2_0;

// the client type described here just means the client library constructor (and not an actual client library instance)
// this is because we want to allow the mock client app code to be able to instantiate UpgradeClient itself
export interface ClientLibraryRef {
  version: string;
  client: new (...args: any[]) => UpgradeClient;
}

export interface ClientConstructorParams {
  userId: string;
  hostUrl: string;
  context: string;
  options?: {
    token?: string;
    clientSessionId?: string;
  };
}

export interface MockClientAppInterfaceModel {
  name: string;
  description: string;
  type: 'frontend' | 'backend';
  hooks: ClientCodeHook[];
  buttons: UserEventButton[];
}

export interface UserEventButton {
  label: string;
  description: string;
  hookName: string;
  payload: Record<string, unknown> | null;
}

export interface ClientCodeHook {
  name: string;
  description: string;
}

export const availableClientLibraries: ClientLibraryRef[] = [
  {
    version: '1.1.7',
    client: UpgradeClient_1_1_17,
  },
  {
    version: '3.0.18',
    client: UpgradeClient_3_0_18,
  },
  {
    version: '4.2.0',
    client: UpgradeClient_4_2_0,
  },
];

export const availableApiHostUrls = [
  { value: 'http://localhost:3030', viewValue: 'LOCAL: http://localhost:3030' },
  { value: 'https://upgradeapi.qa-cli.net', viewValue: 'DEV: https://upgradeapi.qa-cli.net' },
  { value: 'https://upgradeapi.qa-cli.com', viewValue: 'STAGING: https://upgradeapi.qa-cli.com' },
];

// TODO these should come from exisitng mock client services
export const availableMockClientAppInterfaceModels: MockClientAppInterfaceModel[] = [
  {
    name: 'General Test App',
    description: 'Directly test the client library methods',
    type: 'frontend',
    hooks: [
      {
        name: 'init',
        description: 'Will dispatch INIT user',
      },
      {
        name: 'mark',
        description: "Will dispatch MARK event with button's site and target",
      },
    ],
    buttons: [
      {
        label: 'Init',
        description: 'dispatches INIT and ASSIGN events',
        hookName: 'init',
        payload: null,
      },
      {
        label: 'UserAliases',
        description: 'dispatches USER_ALIASES event',
        hookName: 'init',
        payload: null,
      },
      {
        label: 'Open Orange Present',
        description: 'dispatches MARK event',
        hookName: 'mark',
        payload: {
          site: 'get_present',
          target: 'orange_present',
        },
      },
    ],
  },
  {
    name: 'Birthday App',
    description: 'Use this app to get presents.',
    type: 'frontend',
    hooks: [
      {
        name: 'login',
        description: 'Will dispatch INIT and ASSIGN events with user and context',
      },
      {
        name: 'mark',
        description: "Will dispatch MARK event with button's site and target",
      },
    ],
    buttons: [
      {
        label: 'Login',
        description: 'Will construct client and dispatch INIT and ASSIGN events',
        hookName: 'login',
        payload: null,
      },
      {
        label: 'Open Orange Present',
        description: 'Will dispatch MARK event for orange_present',
        hookName: 'mark',
        payload: {
          site: 'get_present',
          target: 'orange_present',
        },
      },
      {
        label: 'Open Purple Present',
        description: 'Will dispatch MARK event for purple_present',
        hookName: 'MARK',
        payload: {
          site: 'get_present',
          target: 'purple_present',
        },
      },
      {
        label: 'Open Green Present',
        description: 'Will dispatch MARK event for green_present',
        hookName: 'MARK',
        payload: {
          site: 'get_present',
          target: 'green_present',
        },
      },
    ],
  },
];

export const TESTER_CONTEXT = 'client_lib_tester';
