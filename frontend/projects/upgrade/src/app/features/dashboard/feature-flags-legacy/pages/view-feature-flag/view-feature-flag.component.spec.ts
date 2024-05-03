import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFeatureFlagComponent } from './view-feature-flag.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { AuthService } from '../../../../../core/auth/auth.service';

xdescribe('ViewFeatureFlagComponent', () => {
  let component: ViewFeatureFlagComponent;
  let fixture: ComponentFixture<ViewFeatureFlagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewFeatureFlagComponent],
      imports: [TestingModule],
      providers: [FeatureFlagsService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewFeatureFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
