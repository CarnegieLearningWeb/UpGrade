import { Component, OnInit } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, catchError, of } from 'rxjs';
import { DataFetchService } from './services/data-fetch.service';
import {
  MockClientAppInterfaceModel,
  availableApiHostUrls,
  availableClientLibraries,
  availableMockClientAppInterfaceModels,
} from './client-library-data';
import { ClientLibraryService } from './services/client-library.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public availableClientVersions = availableClientLibraries;
  public mockClientAppSelectOptions = availableMockClientAppInterfaceModels.map((mockClientApp) => {
    return {
      value: mockClientApp,
      viewValue: mockClientApp.name,
    };
  });
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
    public clientLibraryService: ClientLibraryService
  ) {
    this.configForm = this.fb.group({
      clientLibVersion: this.fb.control('', Validators.required),
      apiHostUrl: this.fb.control('', Validators.required),
      mockClientApp: this.fb.control('', Validators.required),
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
    this.configForm.get('clientLibVersion')?.valueChanges.subscribe(({ version }) => {
      this.connectToBackendTestServer();
    });
  }

  listenForAPIHostUrlChanges() {
    this.configForm.get('apiHostUrl')?.valueChanges.subscribe((url) => {
      if (url) {
        this.getAPIVersion(url);
      }
    });
  }

  // listenForMockClientAppChanges() {
  //   this.configForm.get('mockClientApp')?.valueChanges.subscribe((mockClientApp) => {

  //   });
  // }
}
