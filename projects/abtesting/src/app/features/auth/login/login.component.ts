import { Component, ElementRef, ChangeDetectionStrategy, AfterViewInit, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { SettingsService } from '../../../core/settings/settings.service';
import { ThemeOptions } from '../../../core/settings/store/settings.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements AfterViewInit {

  theme$ = this.settingsService.theme$;
  @ViewChild('googleBtn', { static: false }) googleSignInBtn: ElementRef;
  constructor(
    private authService: AuthService,
    private settingsService: SettingsService
  ) {}

  login() {
    this.authService.authLoginStart();
  }

  ngAfterViewInit() {
    this.authService.attachSignIn(this.googleSignInBtn.nativeElement);
  }

  get ThemeOptions() {
    return ThemeOptions;
  }
}
