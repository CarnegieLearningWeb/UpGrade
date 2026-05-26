import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRootComponent } from './dashboard-root.component';
import { TestingModule } from '../../../../testing/testing.module';
import { SettingsService } from '../../../core/settings/settings.service';
import { AuthService } from '../../../core/auth/auth.service';

describe('DashboardRootComponent', () => {
  let component: DashboardRootComponent;
  let fixture: ComponentFixture<DashboardRootComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardRootComponent],
      imports: [TestingModule],
      providers: [SettingsService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display grimacing face emoji icons in the nav instead of mat-icons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const icons = compiled.querySelectorAll('.icon');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) => {
      expect(icon.textContent?.trim()).toBe('😬');
    });
  });

  it('should not contain any mat-icon elements in the nav', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const matIcons = compiled.querySelectorAll('mat-icon');
    expect(matIcons.length).toBe(0);
  });

  it('should render nav item labels for all route links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLabels = compiled.querySelectorAll('.list-item-label');
    expect(navLabels.length).toBeGreaterThan(0);
  });

  it('should have a drawer container element for the left navigation pane', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const drawerContainer = compiled.querySelector('.drawer-container');
    expect(drawerContainer).toBeTruthy();
  });

  it('should have a mat-drawer element (bright green background applied via SCSS)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const matDrawer = compiled.querySelector('mat-drawer');
    expect(matDrawer).toBeTruthy();
  });

  it('should contain the correct number of nav route links', () => {
    expect(component.routeLinks.length).toBe(5);
  });
});
