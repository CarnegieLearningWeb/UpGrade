import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HashRoutingNavigationService {
  private currentUrl = '';

  constructor(private readonly router: Router) {}

  public initializeHashRouting(): void {
    if (!environment.useHashRouting) {
      return;
    }

    this.currentUrl = window.location.hash.substring(1);

    window.addEventListener('hashchange', (event) => {
      const newUrl = (event as any).newURL;
      const oldUrl = (event as any).oldURL;

      if (!newUrl || !oldUrl) return;

      const newHashPath = newUrl.split('#')[1];
      const oldHashPath = oldUrl.split('#')[1];

      if (newHashPath !== oldHashPath && newHashPath !== this.currentUrl) {
        this.currentUrl = newHashPath;
        this.router.navigateByUrl(newHashPath);
      }
    });
  }
}
