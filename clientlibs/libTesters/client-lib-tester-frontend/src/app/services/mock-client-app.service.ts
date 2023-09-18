import { Injectable } from '@angular/core';
import { MOCK_APP_NAMES } from '../../../../shared/constants';
import { availableFrontendMockApps } from '../app-config';
import { ClientAppHook, HookRequestBody, MockClientAppInterfaceModel } from '../../../../shared/models';
import { MockPortalService } from '../mockFrontendClientAppComponents/mock-portal.service';
import { DataFetchService } from './data-fetch.service';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs/internal/observable/of';
import { EventBusService } from './event-bus.service';
import { ClientLibraryService } from './client-library.service';
import { GeneralTestForVersion41Service } from '../mockFrontendClientAppComponents/general-test-for-version4-1.service';
import { GeneralTestForVersion1Service } from '../mockFrontendClientAppComponents/general-test-for-version1.service';
import { GeneralTestForVersion5Service } from '../mockFrontendClientAppComponents/general-test-for-version5.service';
import { MockMathstreamBrowserService } from '../mockFrontendClientAppComponents/mock-mathstream-browser.service';

@Injectable({
  providedIn: 'root',
})
export class MockClientAppService {
  private mockClientAppInterfaceMap: Record<string, MockClientAppInterfaceModel> = {};
  private selectedMockApp = '';
  private availableMockApps: string[] = availableFrontendMockApps;

  constructor(
    public portalAppService: MockPortalService,
    public generalTest_1_1: GeneralTestForVersion1Service,
    public generalTest_4_1: GeneralTestForVersion41Service,
    public generalTest_5: GeneralTestForVersion5Service,
    public mathstream_AdaptiveSegmentSwapExperiment: MockMathstreamBrowserService,
    public dataFetchService: DataFetchService,
    public eventBus: EventBusService,
    public clientLibraryService: ClientLibraryService
  ) {
    this.getTSBackendModels(); // look here
    this.mockClientAppInterfaceMap = {
      [MOCK_APP_NAMES.PORTAL_APP]: portalAppService.getAppInterfaceModel(),
      [MOCK_APP_NAMES.GENERAL_TS_FRONTEND_1_1]: generalTest_1_1.getAppInterfaceModel(),
      [MOCK_APP_NAMES.GENERAL_TS_FRONTEND_4_1]: generalTest_4_1.getAppInterfaceModel(),
      [MOCK_APP_NAMES.GENERAL_TS_FRONTEND_5_0]: generalTest_5.getAppInterfaceModel(),
      [MOCK_APP_NAMES.MATHSTREAM_AdaptiveSegmentSwapExperiment]:
        mathstream_AdaptiveSegmentSwapExperiment.getAppInterfaceModel(),
    };
  }

  getTSBackendModels(): void {
    this.dataFetchService
      .getAppInterfaceModelsFromTSBackend()
      .pipe(
        catchError((error) => {
          console.log('ts server could not connect', error);
          return of('');
        })
      )
      .subscribe((data: any) => {
        console.log('data from backend:', data);
        // dispatch that TS Backend is connected
        if (data?.models) {
          data.models.forEach((model: MockClientAppInterfaceModel) => {
            this.mockClientAppInterfaceMap[model.name] = model;
            this.pushNewAvailableMockApp(model.name);
            this.eventBus.dispatchServerConnection('ts');
          });

          // this is our success case, so sub to hooks here
          this.listenForHooksToTSServer();
        }
        console.log('mockClientAppInterfaceMap:', this.mockClientAppInterfaceMap);
      });
  }

  getSelectedMockApp(): string {
    return this.selectedMockApp;
  }

  setSelectedMockApp(mockAppName: string): void {
    this.selectedMockApp = mockAppName;
  }

  getAvailableMockApps(): string[] {
    return this.availableMockApps;
  }

  pushNewAvailableMockApp(name: string): void {
    this.availableMockApps.push(name);
  }

  getMockAppInterfaceModelByName(mockAppName: string): any {
    console.log('looking for this user selection:', mockAppName);
    const model = this.mockClientAppInterfaceMap[mockAppName];

    if (!model) {
      console.error(`Mock app service not found for ${mockAppName}`);
    }

    return model;
  }

  listenForHooksToTSServer(): void {
    this.eventBus.mockClientAppHook$.subscribe((hook: ClientAppHook) => {
      console.log('hook received for ts backend:', hook);

      // if hook is valid, then dispatch it to the mock app
      if (!hook.user) {
        console.error('user is missing from hook');
        return;
      }

      const requestHook: HookRequestBody = {
        name: hook.name,
        libVersion: this.clientLibraryService.getSelectedClientLibraryVersion(),
        user: hook.user,
        mockApp: this.getSelectedMockApp(),
        apiHostUrl: this.clientLibraryService.getSelectedAPIHostUrl(),
        payload: hook.payload,
      };

      this.dataFetchService.postHookToTSBackend(requestHook).subscribe((response: any) => {
        // we should have the backend always send back some kind of logging about what happened in snippet
        console.log('response from ts backend:', response);
      });
    });
  }
}
