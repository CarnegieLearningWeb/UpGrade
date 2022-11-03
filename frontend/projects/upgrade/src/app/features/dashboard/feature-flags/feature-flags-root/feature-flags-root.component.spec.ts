import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagsRootComponent } from './feature-flags-root.component';
import { TestingModule } from '../../../../../testing/testing.module';
import { FeatureFlagsListComponent } from '../components/feature-flags-list/feature-flags-list.component';
import { FeatureFlagsService } from '../../../../core/feature-flags/feature-flags.service';
import { AuthService } from '../../../../core/auth/auth.service';

xdescribe('FeatureFlagsRootComponent', () => {
  let component: FeatureFlagsRootComponent;
  let fixture: ComponentFixture<FeatureFlagsRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeatureFlagsRootComponent, FeatureFlagsListComponent],
      imports: [TestingModule],
      providers: [FeatureFlagsService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeatureFlagsRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
