import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { reducers as coreReducers } from '../app/core/core.state';
import { SharedModule } from '../app/shared/shared.module';
import { provideMockStore } from '@ngrx/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Injectable()
export class MockStorage {
  storageDB = {};

  getItem(key) {
    return this.storageDB[key];
  }

  setItem(key, value) {
    this.storageDB[key] = value;
  }

  removeItem(key) {
    delete this.storageDB[key];
  }

  clear() {
    this.storageDB = {};
  }
}

export const mockLocation = {
  protocol: 'https:',
  port: '1234',
  hostname: 'testing.com',
};

export const mockWindow = {
  open() {
    return;
  },
};

@NgModule({
  imports: [
    FormsModule,
    HttpClientTestingModule,
    BrowserAnimationsModule,
    RouterTestingModule,
    CommonModule,
    SharedModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    StoreModule.forRoot({
      ...coreReducers,
    }),
  ],
  exports: [HttpClientTestingModule, RouterTestingModule, CommonModule, SharedModule, TranslateModule, FormsModule],
  providers: [
    provideMockStore({
      initialState: {
        router: {
          state: {
            url: '',
            params: {},
            queryParams: {},
          },
        },
        analysis: {
          isMetricsLoading: false,
          isQueryExecuting: false,
          metrics: [],
          metricsFilter: null,
          queryResult: null,
        },
        auth: {
          isLoggedIn: false,
          isAuthenticating: false,
          user: null,
        },
        experimentUsers: {
          ids: [],
          entities: {},
          isLoading: false,
        },
        experiments: {
          ids: [],
          entities: {},
          isLoadingExperiment: false,
          skipExperiment: 0,
          totalExperiments: null,
          searchKey: 'all',
          searchString: null,
          sortKey: null,
          sortAs: null,
          stats: {},
          graphInfo: null,
          graphRange: null,
          isGraphInfoLoading: false,
          allPartitions: null,
          allExperimentNames: null,
          context: [],
        },
        featureFlags: {
          ids: [],
          entities: {},
          isLoadingFeatureFlags: false,
          skipFlags: 0,
          totalFlags: 0,
          searchKey: 'all',
          searchString: null,
          sortKey: null,
          sortAs: null,
        },
        logs: {
          ids: [],
          entities: {},
          isAuditLogLoading: false,
          isErrorLogLoading: false,
          skipAuditLog: 0,
          totalAuditLogs: null,
          skipErrorLog: 0,
          totalErrorLogs: null,
          auditLogFilter: null,
          errorLogFilter: null,
        },
        previewUsers: {
          ids: [],
          entities: {},
          isLoading: false,
          skipPreviewUsers: 0,
          totalPreviewUsers: null,
        },
        settings: {
          theme: 'light',
          toCheckAuth: null,
          toFilterMetric: null,
        },
        users: {
          ids: [],
          entities: {},
          isUsersLoading: false,
          skipUsers: 0,
          totalUsers: null,
          searchKey: 'all',
          searchString: null,
          sortKey: null,
          sortAs: null,
        },
      },
    }),
    { provide: 'LOCATION', useValue: mockLocation },
    { provide: 'SESSION_STORAGE', useValue: new MockStorage() },
    { provide: 'WINDOW', useValue: mockWindow },
  ],
})
export class TestingModule {}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
