import {
  Component,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit,
  ViewChild,
  Inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthDataService } from '../../../core/auth/auth.data.service';
import { AppState } from '../../../core/core.module';
import * as authActions from '../../../core/auth/store/auth.actions';
import { ENV, Environment } from '../../../../environments/environment-types';
import { FAKE_DEV_CREDENTIAL } from 'upgrade_types';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleSignInButtonRef') googleSignInButtonRef: ElementRef;

  configCheckError: string | null = null;

  constructor(
    private authService: AuthService,
    private authDataService: AuthDataService,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    @Inject(ENV) private environment: Environment
  ) {}

  ngAfterViewInit(): void {
    if (this.environment.envName !== 'DEV') {
      this.authService.initializeGoogleSignInButton(this.googleSignInButtonRef);
      return;
    }

    this.authDataService
      .checkAuthConfig()
      .pipe(take(1))
      .subscribe({
        next: ({ googleAuthRequired, devUser }) => {
          if (!googleAuthRequired && devUser) {
            this.store$.dispatch(authActions.actionSetGoogleCredential({ googleCredential: FAKE_DEV_CREDENTIAL }));
            this.store$.dispatch(
              authActions.actionLoginStart({ user: devUser, googleCredential: FAKE_DEV_CREDENTIAL })
            );
          } else {
            this.authService.initializeGoogleSignInButton(this.googleSignInButtonRef);
          }
        },
        error: (err: unknown) => {
          this.configCheckError = err instanceof Error ? err.message : 'Failed to load auth configuration.';
          this.cdr.markForCheck();
        },
      });
  }
}
