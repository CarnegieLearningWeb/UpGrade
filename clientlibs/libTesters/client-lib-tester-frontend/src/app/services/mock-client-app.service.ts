import { Injectable } from '@angular/core';
import { availableMockApps } from '../app-config';
import { BirthdayPresentAppService } from '../mockFrontendClientAppComponents/birthday-present-app.service';
import { MockClientAppInterfaceModel } from '../../../../shared/models';
import { MockPortalService } from '../mockFrontendClientAppComponents/mock-portal.service';
import { DataFetchService } from './data-fetch.service';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs/internal/observable/of';
import { EventBusService } from './event-bus.service';

@Injectable({
  providedIn: 'root',
})
export class MockClientAppService {
  private mockClientAppInterfaceMap: Record<string, MockClientAppInterfaceModel> = {};
  private selectedMockApp = '';

  // Just the frontend mock apps get loaded initially, others will be loaded from the backend
  private availableMockApps = ['Birthday App', 'Mock Portal'];

  constructor(
    public bdayAppService: BirthdayPresentAppService,
    public portalAppService: MockPortalService,
    public dataFetchService: DataFetchService,
    public eventBus: EventBusService
  ) {
    this.getTSBackendModels();
    this.mockClientAppInterfaceMap = {
      [availableMockApps.BDAY_APP]: bdayAppService.getAppInterfaceModel(),
      [availableMockApps.PORTAL_APP]: portalAppService.getAppInterfaceModel(),
    };
  }

  getTSBackendModels(): void {
    this.dataFetchService
      .getAppInterfaceModelsFromTSBackend()
      .pipe(
        catchError((error) => {
          console.error(error);
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
}
