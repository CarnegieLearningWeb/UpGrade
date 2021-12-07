import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideMockStore } from '@ngrx/store/testing';

import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { TestingModule } from '../testing/testing.module';
import { AuthService } from './core/auth/auth.service';
import { SimpleNotificationsModule } from 'angular2-notifications';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        TestingModule,
        // global configuration for notification
        SimpleNotificationsModule.forRoot({
          position: ["bottom", "center"],
          timeOut: 4000,
          showProgressBar: false,
          pauseOnHover: true,
          clickToClose: false
      }),
      ],
      providers: [
        provideMockStore({
          initialState: {
            settings: {},
            auth: {}
          }
        }),
        AuthService
      ],
      declarations: [AppComponent]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
