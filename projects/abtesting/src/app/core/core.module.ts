import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf, ErrorHandler } from '@angular/core';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { StoreRouterConnectingModule, RouterStateSerializer } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { environment } from '../../environments/environment';

import { AppState, reducers, metaReducers, selectRouterState } from './core.state';
import { TitleService } from './title/title.service';
import { AppErrorHandler } from './error-handler/app-error-handler.service';
import { CustomSerializer } from './router/custom-serializer';
import { LocalStorageService } from './local-storage/local-storage.service';
import { HttpErrorInterceptor } from './http-interceptors/http-error.interceptor';
import { NotificationService } from './notifications/notification.service';
import { ExperimentsModule } from './experiments/experiments.module';
import { SettingsModule } from './settings/settings.module';
import { AuthModule } from './auth/auth.module';
import { LogsModule } from './logs/logs.module';
import { ExperimentUsersModule } from './experiment-users/experiment-users.module';
import { PreviewUsersModule } from './preview-users/preview-users.module';
import { UsersModule } from './users/users.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { HttpAuthInterceptor } from './http-interceptors/http-auth.interceptor';
import { AnalysisModule } from './analysis/analysis.module';

export {
  TitleService,
  AppState,
  LocalStorageService,
  selectRouterState,
  NotificationService
};

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, `${environment.i18nPrefix}/assets/i18n/`, '.json');
}

@NgModule({
  imports: [
    // angular
    CommonModule,
    HttpClientModule,

    // Store Modules
    AuthModule,
    SettingsModule,
    ExperimentsModule,
    LogsModule,
    ExperimentUsersModule,
    PreviewUsersModule,
    UsersModule,
    FeatureFlagsModule,
    AnalysisModule,

    // ngrx
    StoreModule.forRoot(reducers, { metaReducers }),
    StoreRouterConnectingModule.forRoot(),
    EffectsModule.forRoot([]),
    environment.production
      ? []
      : StoreDevtoolsModule.instrument({
          name: 'AB Testing Starter'
        }),

    // 3rd party
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  declarations: [],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpAuthInterceptor, multi: true },
    { provide: ErrorHandler, useClass: AppErrorHandler },
    { provide: RouterStateSerializer, useClass: CustomSerializer }
  ],
  exports: [TranslateModule]
})
export class CoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: CoreModule
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule');
    }
  }
}
