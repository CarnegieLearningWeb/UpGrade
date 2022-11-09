import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagVariationsComponent } from './flag-variations.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { FeatureFlagsService } from '../../../../../core/feature-flags/feature-flags.service';

xdescribe('FlagVariationsComponent', () => {
  let component: FlagVariationsComponent;
  let fixture: ComponentFixture<FlagVariationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FlagVariationsComponent],
      imports: [TestingModule],
      providers: [FeatureFlagsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlagVariationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
