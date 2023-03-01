import { Component, ElementRef, ChangeDetectionStrategy, AfterViewInit, ViewChild, Inject } from '@angular/core';
import { ENV, Environment } from '../../../../environments/environment-types';
import { AuthService } from '../../../core/auth/auth.service';
import { SettingsService } from '../../../core/settings/settings.service';
import { ThemeOptions } from '../../../core/settings/store/settings.model';
// declare const google: any; // TODO download google types
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements AfterViewInit {
  theme$ = this.settingsService.theme$;
  @ViewChild('googleSignInButtonRef') googleSignInButtonRef: ElementRef;

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    @Inject(ENV) private environment: Environment
  ) {}

  ngAfterViewInit(): void {
    this.authService.initializeGoogleSignInButton(this.googleSignInButtonRef);
  }

  get ThemeOptions() {
    return ThemeOptions;
  }
}
