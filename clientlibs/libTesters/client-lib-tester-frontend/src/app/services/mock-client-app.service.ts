import { Injectable } from '@angular/core';
import { availableMockApps } from '../app-config';
import { BirthdayPresentAppService } from '../mockFrontendClientAppComponents/birthday-present-app.service';
import { MockClientAppInterfaceModel } from '../app-models';
import { MockPortalService } from '../mockFrontendClientAppComponents/mock-portal.service';

@Injectable({
  providedIn: 'root',
})
export class MockClientAppService {
  private mockClientAppInterfaceMap: Record<string, MockClientAppInterfaceModel> = {};
  private selectedMockApp = '';

  constructor(public bdayAppService: BirthdayPresentAppService, public portalAppService: MockPortalService) {
    this.mockClientAppInterfaceMap = {
      [availableMockApps.BDAY_APP]: bdayAppService.getAppInterfaceModel(),
      [availableMockApps.PORTAL_APP]: portalAppService.getAppInterfaceModel(),
    };
  }

  getSelectedMockApp(): string {
    return this.selectedMockApp;
  }

  setSelectedMockApp(mockAppName: string): void {
    this.selectedMockApp = mockAppName;
  }

  getMockAppInterfaceModelByName(mockAppName: string): any {
    const model = this.mockClientAppInterfaceMap[mockAppName];

    if (!model) {
      throw new Error(`Mock app service not found for ${mockAppName}`);
    }

    return model;
  }
}
