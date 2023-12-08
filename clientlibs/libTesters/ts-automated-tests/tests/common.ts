import axios, { AxiosRequestConfig } from 'axios';
import { HookRequestBody, HookResponse, MockClientAppUser } from '../../shared/models';
import { AbstractTSBackendMockApp } from '../../ts-lib-tester-backend-server/src/mockBackendTSServerApps/AbstractTSBackendMockApp';
import { getUpgradeClientConstructor } from '../../ts-lib-tester-backend-server/src/utils';
import routeHookToMockApp from '../../ts-lib-tester-backend-server/src/routeHookToMockApp';

export class TSAutomatedTestUtils {
  private requestOptions: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  constructor(
    public mockApp: AbstractTSBackendMockApp,
    public clientLibraryVersion: string,
    public apiHostUrl: string
  ) {}

  async initTestUser(testUser: TestUser): Promise<HookResponse> {
    const hookRequest: HookRequestBody = new TestHookRequest(
      this.mockApp.NAME,
      this.clientLibraryVersion,
      this.mockApp.HOOKNAMES.GROUP_MEMBERSHIP,
      testUser,
      this.apiHostUrl
    );

    const ClientLibConstructor = getUpgradeClientConstructor(hookRequest.libVersion);
    return routeHookToMockApp(ClientLibConstructor, hookRequest);
  }

  async dispatchHook(hookname: string, user: TestUser, payload?: Record<string, any>) {
    const hookRequest: HookRequestBody = new TestHookRequest(
      this.mockApp.NAME,
      this.clientLibraryVersion,
      hookname,
      user,
      this.apiHostUrl,
      payload,
    );

    const ClientLibConstructor = getUpgradeClientConstructor(hookRequest.libVersion);
    const UpgradeResponse: HookResponse = await routeHookToMockApp(ClientLibConstructor, hookRequest);

    return UpgradeResponse;
  }

  async createTestExperiment(mockExperiment: any) {
    try {
      const createExperimentResponse = await axios.post(
        `${this.apiHostUrl}/api/experiments`,
        mockExperiment,
        this.requestOptions
      );
      console.log({ createExperimentResponse });
      return createExperimentResponse;
    } catch (error) {
      console.log({ error });
      return null;
    }
  }

  async deleteTestExperiment(experimentId: string) {
    try {
      const deleteExperimentResponse = await axios.delete(
        `${this.apiHostUrl}/api/experiments/${experimentId}`,
        this.requestOptions
      );
      console.log({ deleteExperimentResponse });
      return deleteExperimentResponse;
    } catch (error) {
      console.log({ error });
      return null;
    }
  }
}

export class TestHookRequest implements HookRequestBody {
  constructor(
    public mockApp: string,
    public libVersion: string,
    public name: string,
    public user: MockClientAppUser,
    public apiHostUrl: string,
    public payload?: Record<string, any>
  ) {}

  getMockApp() {
    return this.mockApp;
  }

  setMockApp(mockApp: string) {
    this.mockApp = mockApp;
  }

  getLibVersion() {
    return this.libVersion;
  }

  setLibVersion(libVersion: string) {
    this.libVersion = libVersion;
  }

  getName() {
    return this.name;
  }

  setName(name: string) {
    this.name = name;
  }

  getUser() {
    return this.user;
  }

  setUser(user: MockClientAppUser) {
    this.user = user;
  }
}

export class TestUser implements MockClientAppUser {
  constructor(
    public id: string,
    public groups: Record<string, Array<string>>,
    public workingGroup: Record<string, string>,
    public userAliases: string[]
  ) {}

  getId() {
    return this.id;
  }
  setId(id: string) {
    this.id = id;
  }
  getGroups() {
    return this.groups;
  }
  setGroups(groups: Record<string, Array<string>>) {
    this.groups = groups;
  }
  getWorkingGroup() {
    return this.workingGroup;
  }
  setWorkingGroup(workingGroup: Record<string, string>) {
    this.workingGroup = workingGroup;
  }
}
