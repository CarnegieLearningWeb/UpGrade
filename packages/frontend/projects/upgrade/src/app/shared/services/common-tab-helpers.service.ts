import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class CommonTabHelpersService {
  private router = inject(Router);

  navigateToTab(index: number, route: ActivatedRoute): void {
    this.router.navigate([], {
      relativeTo: route,
      queryParams: { tab: index },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  getTabIndexFromQueryParams(route: ActivatedRoute, tabCount: number): number | null {
    const tab = route.snapshot.queryParamMap.get('tab');
    if (!tab) return null;

    const selectedTab = parseInt(tab, 10);
    if (isNaN(selectedTab)) {
      console.warn('Tab index from url is not a number');
      return null;
    }

    if (selectedTab < 0 || selectedTab >= tabCount) {
      console.warn('Tab index from url is out of range');
      return null;
    }

    return selectedTab;
  }
}
