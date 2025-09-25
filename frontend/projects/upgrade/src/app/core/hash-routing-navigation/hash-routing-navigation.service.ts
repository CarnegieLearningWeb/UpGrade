import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HashRoutingNavigationService {
  constructor(private readonly router: Router) {}

  public initializeHashRouting(): void {
    if (!environment.useHashRouting) {
      return;
    }

    window.addEventListener('hashchange', (event: any) => {
      this.router.navigateByUrl(event);
    });
  }
}
