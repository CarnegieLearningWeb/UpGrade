/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonTabHelpersService } from './common-tab-helpers.service';

describe('CommonTabHelpersService', () => {
  let service: CommonTabHelpersService;
  let mockRouter: { navigate: jest.Mock };

  const mockRoute = (tabValue: string | null): ActivatedRoute =>
    ({
      snapshot: {
        queryParamMap: {
          get: jest.fn().mockReturnValue(tabValue),
        },
      },
    } as unknown as ActivatedRoute);

  beforeEach(() => {
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [CommonTabHelpersService, { provide: Router, useValue: mockRouter }],
    });

    service = TestBed.inject(CommonTabHelpersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('navigateToTab', () => {
    it('should call router.navigate with the correct tab query param', () => {
      const route = mockRoute(null);

      service.navigateToTab(2, route);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], {
        relativeTo: route,
        queryParams: { tab: 2 },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    it('should navigate to index 0', () => {
      const route = mockRoute(null);

      service.navigateToTab(0, route);

      expect(mockRouter.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { tab: 0 } }));
    });
  });

  describe('getTabIndexFromQueryParams', () => {
    it('should return the parsed tab index when valid', () => {
      const route = mockRoute('1');

      expect(service.getTabIndexFromQueryParams(route, 3)).toBe(1);
    });

    it('should return 0 when tab param is "0"', () => {
      const route = mockRoute('0');

      expect(service.getTabIndexFromQueryParams(route, 3)).toBe(0);
    });

    it('should return null when tab query param is absent', () => {
      const route = mockRoute(null);

      expect(service.getTabIndexFromQueryParams(route, 3)).toBeNull();
    });

    it('should return null and warn when tab is not a number', () => {
      const route = mockRoute('abc');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(service.getTabIndexFromQueryParams(route, 3)).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('Tab index from url is not a number');

      warnSpy.mockRestore();
    });

    it('should return null and warn when tab index is negative', () => {
      const route = mockRoute('-1');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(service.getTabIndexFromQueryParams(route, 3)).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('Tab index from url is out of range');

      warnSpy.mockRestore();
    });

    it('should return null and warn when tab index equals tabCount', () => {
      const route = mockRoute('3');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(service.getTabIndexFromQueryParams(route, 3)).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('Tab index from url is out of range');

      warnSpy.mockRestore();
    });

    it('should return null and warn when tab index exceeds tabCount', () => {
      const route = mockRoute('10');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(service.getTabIndexFromQueryParams(route, 3)).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('Tab index from url is out of range');

      warnSpy.mockRestore();
    });

    it('should return the last valid index (tabCount - 1)', () => {
      const route = mockRoute('2');

      expect(service.getTabIndexFromQueryParams(route, 3)).toBe(2);
    });
  });
});
