import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagOverviewComponent } from './flag-overview.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';

xdescribe('FlagOverviewComponent', () => {
  let component: FlagOverviewComponent;
  let fixture: ComponentFixture<FlagOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FlagOverviewComponent],
      imports: [TestingModule],
      providers: [FeatureFlagsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlagOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
