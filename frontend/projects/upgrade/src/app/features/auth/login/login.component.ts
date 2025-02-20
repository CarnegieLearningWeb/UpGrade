import { Component, ElementRef, ChangeDetectionStrategy, AfterViewInit, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleSignInButtonRef') googleSignInButtonRef: ElementRef;

  constructor(private authService: AuthService) {}

  ngAfterViewInit(): void {
    this.authService.initializeGoogleSignInButton(this.googleSignInButtonRef);
  }
}
