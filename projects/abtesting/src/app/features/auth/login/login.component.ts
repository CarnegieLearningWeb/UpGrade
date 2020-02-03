import { Component, ElementRef, ChangeDetectionStrategy, AfterViewInit, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements AfterViewInit {

  @ViewChild('googleBtn', { static: false }) googleSignInBtn: ElementRef;
  constructor(
    private authService: AuthService,
  ) {}

  login() {
    this.authService.authLoginStart();
  }

  ngAfterViewInit() {
    this.authService.attachSignIn(this.googleSignInBtn.nativeElement);
  }
}
