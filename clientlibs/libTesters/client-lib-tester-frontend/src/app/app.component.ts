import { Component, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, debounceTime, of } from 'rxjs';
import { DataFetchService } from './services/data-fetch.service';
import { MockClientAppInterfaceModel } from '../../../shared/models';
import { ClientLibraryService } from './services/client-library.service';
import { availableClientLibraries, availableApiHostUrls } from './app-config';
import { MockClientAppService } from './services/mock-client-app.service';
import { EventBusService } from './services/event-bus.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public availableClientVersions = availableClientLibraries;
  public mockClientAppSelectOptions: { value: MockClientAppInterfaceModel; viewValue: string }[] = [];
  public clientLibVersionSelectOptions = availableClientLibraries.map((clientLibrary) => {
    const languageLabel = this.getLanguageLabel(clientLibrary.language);

    return {
      value: clientLibrary.version,
      viewValue: `${languageLabel}: ${clientLibrary.version}`,
    };
  });

  public apiHostUrls = availableApiHostUrls;
  public apiValidatedVersion = '';
  public mockServerConnection = null;
  public configForm: FormGroup;
  public configComplete$ = new BehaviorSubject<boolean>(false);
  public serverConnections: string[] = [];

  constructor(
    private readonly fb: NonNullableFormBuilder,
    public dataFetchService: DataFetchService,
    public clientLibraryService: ClientLibraryService,
    public mockClientAppService: MockClientAppService,
    public eventBus: EventBusService
  ) {
    this.configForm = this.fb.group({
      clientLibVersion: this.fb.control('', Validators.required),
      apiHostUrl: this.fb.control('', Validators.required),
      mockClientApp: this.fb.control('', Validators.required),
    });

    this.createMockAppSelectOption();
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
    this.listenForMockClientAppChanges();
    this.listenForClientLibVersionChanges();
    this.listenForAPIHostUrlChanges();
    this.listenForServerConnectionChanges();
  }

  getLanguageLabel(language: string): string {
    if (language === 'ts') {
      return 'TypeScript';
    } else if (language === 'java') {
      return 'Java';
    } else {
      return '';
    }
  }

  setServerConnections(connections: string[]) {
    this.serverConnections = connections;
  }

  // maybe this needs to wait a second
  createMockAppSelectOption() {
    const newMockClientAppSelectOptions: { value: MockClientAppInterfaceModel; viewValue: string }[] = [];
    const availableMockApps = this.mockClientAppService.getAvailableMockApps();
    availableMockApps.forEach((mockAppName) => {
      const mockAppInterfaceModel = this.mockClientAppService.getMockAppInterfaceModelByName(mockAppName);

      newMockClientAppSelectOptions.push({
        value: mockAppInterfaceModel,
        viewValue: mockAppName,
      });
    });

    this.mockClientAppSelectOptions = newMockClientAppSelectOptions;
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

  listenForServerConnectionChanges() {
    this.eventBus.serverConnections$.subscribe((mockServerConnections: string[]) => {
      if (mockServerConnections.length > 0) {
        this.createMockAppSelectOption();
      }
      this.setServerConnections(mockServerConnections);
    });
  }

  listenForClientLibVersionChanges() {
    this.configForm.get('clientLibVersion')?.valueChanges.subscribe((version) => {
      this.clientLibraryService.setSelectedClientLibraryVersion(version);
    });
  }

  listenForAPIHostUrlChanges() {
    this.configForm
      .get('apiHostUrl')
      ?.valueChanges.pipe(debounceTime(400))
      .subscribe((url) => {
        if (url) {
          this.getAPIVersion(url);
          this.clientLibraryService.setSelectedAPIHostUrl(url);
        }
      });
  }

  listenForMockClientAppChanges() {
    this.configForm.get('mockClientApp')?.valueChanges.subscribe((mockClientApp) => {
      this.mockClientAppService.setSelectedMockApp(mockClientApp.name);
      this.eventBus.dispatchMockAppChange(mockClientApp.name);
    });
  }
}
