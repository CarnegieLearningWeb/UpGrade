import { Injectable } from '@angular/core';
import { availableMockApps } from '../app-config';
import { BirthdayPresentAppService } from '../mockFrontendClientAppComponents/birthday-present-app.service';
import { MockClientAppInterfaceModel } from '../app-models';

@Injectable({
  providedIn: 'root',
})
export class MockClientAppService {
  private mockClientAppInterfaceMap: Record<string, MockClientAppInterfaceModel> = {};

  constructor(public bdayAppService: BirthdayPresentAppService) {
    this.mockClientAppInterfaceMap = {
      [availableMockApps.BDAY_APP]: bdayAppService.getAppInterfaceModel(),
    };
  }

  // make all known apps available as services by app-name
  // for each available app name, inject those services
  getMockAppInterfaceModelByName(mockAppName: string): any {
    const model = this.mockClientAppInterfaceMap[mockAppName];

    if (!model) {
      throw new Error(`Mock app service not found for ${mockAppName}`);
    }

    return model;
  }
}
