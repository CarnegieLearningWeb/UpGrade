import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, inject, provideAppInitializer } from '@angular/core';

import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { environment } from '../environments/environment';
import { ENV } from '../environments/environment-types';
import { AuthModule } from './core/auth/auth.module';
import { provideImportServiceTypeAdapters } from './shared-standalone-component-lib/components/common-import-modal/common-import-type-adapters';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    // global configuration for notification
    SimpleNotificationsModule.forRoot({
      position: ['bottom', 'center'],
      timeOut: 4000,
      showProgressBar: false,
      pauseOnHover: true,
      clickToClose: false,
    }),
    // core & shared
    CoreModule,
    SharedModule,
    // app
    AppRoutingModule,
    FormsModule,
    AuthModule,
  ],
  providers: [
    { provide: ENV, useValue: environment },
    provideHttpClient(withInterceptorsFromDi()),
    ...provideImportServiceTypeAdapters(),
  ],
})
export class AppModule {}
