import { Component, ElementRef, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements AfterViewInit {

  constructor(
    private element: ElementRef,
    private authService: AuthService,
  ) {}

  login() {
    this.authService.authLoginStart();
  }

  ngAfterViewInit() {
    this.authService.attachSignIn(this.element.nativeElement);
  }
}
