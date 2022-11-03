import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewFlagComponent } from './new-flag.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { FlagVariationsComponent } from '../../flag-variations/flag-variations.component';
import { FlagOverviewComponent } from '../../flag-overview/flag-overview.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

xdescribe('NewFlagComponent', () => {
  let component: NewFlagComponent;
  let fixture: ComponentFixture<NewFlagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NewFlagComponent, FlagOverviewComponent, FlagVariationsComponent],
      imports: [TestingModule],
      providers: [
        FeatureFlagsService,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: [] },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
