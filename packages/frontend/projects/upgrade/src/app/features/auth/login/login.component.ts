import { Component, ElementRef, ChangeDetectionStrategy, AfterViewInit, ViewChild, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthDataService } from '../../../core/auth/auth.data.service';
import { AppState } from '../../../core/core.module';
import * as authActions from '../../../core/auth/store/auth.actions';
import { ENV, Environment } from '../../../../environments/environment-types';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleSignInButtonRef') googleSignInButtonRef: ElementRef;

  constructor(
    private authService: AuthService,
    private authDataService: AuthDataService,
    private store$: Store<AppState>,
    @Inject(ENV) private environment: Environment
  ) {}

  ngAfterViewInit(): void {
    if (this.environment.envName !== 'DEV') {
      this.authService.initializeGoogleSignInButton(this.googleSignInButtonRef);
      return;
    }

    this.authDataService.checkAuthConfig().subscribe(({ googleAuthRequired, devUser }) => {
      if (!googleAuthRequired && devUser) {
        const googleCredential = 'fake-dev-user-google-credential';
        this.store$.dispatch(authActions.actionSetGoogleCredential({ googleCredential }));
        this.store$.dispatch(authActions.actionLoginStart({ user: devUser, googleCredential }));
      } else {
        this.authService.initializeGoogleSignInButton(this.googleSignInButtonRef);
      }
    });
  }
}
