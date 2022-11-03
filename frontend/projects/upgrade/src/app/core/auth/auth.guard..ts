import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { AuthService } from './auth.service';
import { map, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return combineLatest([this.authService.isLoggedIn$, this.authService.isAuthenticating$]).pipe(
      filter(([, isAuthenticating]) => !isAuthenticating),
      map(([isLoggedIn]) => {
        if (isLoggedIn) {
          return true;
        } else {
          this.authService.setRedirectionUrl(state.url);
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
