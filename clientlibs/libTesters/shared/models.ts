export interface HookRequestBody {
  name: string;
  user: MockClientAppUser;
  libVersion: string;
  mockApp: string;
  apiHostUrl: string;
  payload?: any;
}

export interface HookResponse {
  hookReceived: HookRequestBody;
  response: any;
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

export interface UpgradeExperimentContextMetadata {
  EXP_IDS: string[]; // target
  EXP_POINTS: string[]; // site
  GROUP_TYPES: string[];
  CONDITIONS: string[];
}

export interface MockClientAppInterfaceModel {
  name: string;
  description: string;
  type: MockAppType;
  language: CodeLanguage;
  hooks: ClientAppHook[];
  decisionPoints: DecisionPoint[];
  groups: string[];
  buttons: UserEventButton[];
}

export interface UserEventButton {
  label: string;
  hookName: string;
  props?: Record<string, unknown>;
}

export interface ClientAppHook {
  name: string;
  description?: string;
  user?: MockClientAppUser;
  payload?: any;
}

export interface DecisionPoint {
  site: string;
  target: string;
}

export interface MockClientAppUser {
  id: string;
  groups: Record<string, Array<string>>;
  workingGroup: Record<string, string>;
  userAliases: Array<string>;
}

export type MockAppType = 'frontend' | 'backend';
export type CodeLanguage = 'ts' | 'java';
