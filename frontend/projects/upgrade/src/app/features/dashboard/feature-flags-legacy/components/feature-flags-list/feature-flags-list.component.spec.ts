import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagsListComponent } from './feature-flags-list.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';
import { AuthService } from '../../../../../core/auth/auth.service';

xdescribe('FeatureFlagsListComponent', () => {
  let component: FeatureFlagsListComponent;
  let fixture: ComponentFixture<FeatureFlagsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeatureFlagsListComponent],
      imports: [TestingModule],
      providers: [FeatureFlagsService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeatureFlagsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
