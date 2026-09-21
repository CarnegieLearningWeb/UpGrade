import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router } from '@angular/router';
import { routes } from './dashboard-routing.module';

@Component({ template: '' })
class StubComponent {}

// The routing decisions under test (redirects, pathMatch, guards) don't depend on the routed
// components, so lazy component loading is stubbed to keep the spec fast and hermetic.
const stubComponents = (route: Route): Route => ({
  ...route,
  ...(route.loadComponent ? { loadComponent: () => StubComponent } : {}),
  ...(route.children ? { children: route.children.map(stubComponents) } : {}),
});

// Regression tests for the id-less detail URL handling. The trailing-slash case is subtle:
// Angular parses '/home/detail/' as ['home', 'detail', ''], so the static 'home/detail'
// redirect (pathMatch: 'full', 2 segments) cannot match it - instead the empty segment
// matches ':experimentId' and the requireRouteParam guard performs the redirect.
describe('dashboard routing', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes.map(stubComponents))] });
    router = TestBed.inject(Router);
  });

  it.each([
    ['/home/detail', '/home'],
    ['/home/detail/', '/home'],
    ['/featureflags/detail', '/featureflags'],
    ['/featureflags/detail/', '/featureflags'],
    ['/segments/detail', '/segments'],
    ['/segments/detail/', '/segments'],
  ])('should redirect the id-less detail URL %s to %s', async (url, expected) => {
    await router.navigateByUrl(url);

    expect(router.url).toBe(expected);
  });

  it('should not redirect a detail URL that has an id', async () => {
    const url = '/home/detail/2382605e-1dd0-43fa-bbfd-59e3a460efa6';

    await router.navigateByUrl(url);

    expect(router.url).toBe(url);
  });
});
