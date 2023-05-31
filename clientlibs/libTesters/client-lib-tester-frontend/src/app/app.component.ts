import { Component, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { DataFetchService } from './services/data-fetch.service';
import { MockClientAppInterfaceModel } from './app-models';
import { ClientLibraryService } from './services/client-library.service';
import { availableClientLibraries, availableApiHostUrls, availableMockApps } from './app-config';
import { MockClientAppService } from './services/mock-client-app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public availableClientVersions = availableClientLibraries;
  public mockClientAppSelectOptions: { value: MockClientAppInterfaceModel; viewValue: string }[] = [];
  public clientLibVersionSelectOptions = availableClientLibraries.map((clientLibrary) => {
    return {
      value: clientLibrary.version,
      viewValue: 'TypeScript: ' + clientLibrary.version,
    };
  });

  public apiHostUrls = availableApiHostUrls;
  public apiValidatedVersion = '';
  public mockServerConnection = null;
  public configForm: FormGroup;
  public configComplete$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly fb: NonNullableFormBuilder,
    public dataFetchService: DataFetchService,
    public clientLibraryService: ClientLibraryService,
    public mockClientAppService: MockClientAppService
  ) {
    this.configForm = this.fb.group({
      clientLibVersion: this.fb.control('', Validators.required),
      apiHostUrl: this.fb.control('', Validators.required),
      mockClientApp: this.fb.control('', Validators.required),
    });
    Object.values(availableMockApps).forEach((mockAppName) => {
      const mockAppInterfaceModel = this.mockClientAppService.getMockAppInterfaceModelByName(mockAppName);

      this.mockClientAppSelectOptions.push({
        value: mockAppInterfaceModel,
        viewValue: mockAppName,
      });
    });
  }

  get selectedApiHostUrl(): string {
    return this.configForm.get('apiHostUrl')?.value || '';
  }

  get selectedClientLibVersion(): string {
    return this.configForm.get('clientLibVersion')?.value || '';
  }

  get selectedMockClientAppInterface(): MockClientAppInterfaceModel {
    return this.configForm.get('mockClientApp')?.value || '';
  }

  ngOnInit() {
    this.listenForAPIHostUrlChanges();
    this.listenForClientLibVersionChanges();
  }
  getAPIVersion(url: string): void {
    this.apiValidatedVersion = 'pending';
    this.dataFetchService
      .getVersionFromAPIHost(url)
      .pipe(
        catchError((error) => {
          this.resetApiValidatedVersion();
          console.error(error);
          return of('');
        })
      )
      .subscribe((versionResponse) => {
        this.apiValidatedVersion = versionResponse;
      });
  }

  resetApiValidatedVersion(): void {
    this.apiValidatedVersion = '';
  }

  connectToBackendTestServer(): void {
    console.log('connectToBackendTestServer');
  }

  listenForClientLibVersionChanges() {
    this.configForm.get('clientLibVersion')?.valueChanges.subscribe((version) => {
      this.clientLibraryService.setSelectedClientLibraryVersion(version);
    });
  }

  listenForAPIHostUrlChanges() {
    this.configForm.get('apiHostUrl')?.valueChanges.subscribe((url) => {
      if (url) {
        this.getAPIVersion(url);
        this.clientLibraryService.setSelectedAPIHostUrl(url);
      }
    });
  }

  // listenForMockClientAppChanges() {
  //   this.configForm.get('mockClientApp')?.valueChanges.subscribe((mockClientApp) => {

  //   });
  // }
}
