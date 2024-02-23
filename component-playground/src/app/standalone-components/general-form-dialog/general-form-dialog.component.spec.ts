import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralFormDialogComponent } from './general-form-dialog.component';

describe('GeneralFormModalComponent', () => {
  let component: GeneralFormDialogComponent;
  let fixture: ComponentFixture<GeneralFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralFormDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneralFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
