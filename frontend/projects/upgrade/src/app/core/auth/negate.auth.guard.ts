import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { AuthService } from './auth.service';
import { map, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NegateAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return combineLatest([this.authService.isLoggedIn$, this.authService.isAuthenticating$]).pipe(
      filter(([, isAuthenticating]) => !isAuthenticating),
      map(([isLoggedIn]) => {
        if (isLoggedIn) {
          this.router.navigate(['/home']);
          return false;
        } else {
          return true;
        }
      })
    );
  }
}
