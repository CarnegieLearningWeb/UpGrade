import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteFlagComponent } from './delete-flag.component';
import { TestingModule } from '../../../../../../../testing/testing.module';
import { FeatureFlagsService } from '../../../../../../core/feature-flags/feature-flags.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

xdescribe('DeleteFlagComponent', () => {
  let component: DeleteFlagComponent;
  let fixture: ComponentFixture<DeleteFlagComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteFlagComponent],
      imports: [TestingModule],
      providers: [
        FeatureFlagsService,
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: [] },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
