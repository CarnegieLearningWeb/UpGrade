import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SimpleNotificationsModule } from 'angular2-notifications';

@NgModule({
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    // global configuration for notification
    SimpleNotificationsModule.forRoot({
        position: ["bottom", "center"],
        timeOut: 4000,
        showProgressBar: false,
        pauseOnHover: true,
        clickToClose: false
    }),

    // core & shared
    CoreModule,
    SharedModule,

    // app
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
