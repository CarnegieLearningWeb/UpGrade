import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestgDialogFormComponent } from './testg-dialog-form.component';

describe('TestgDialogFormComponent', () => {
  let component: TestgDialogFormComponent;
  let fixture: ComponentFixture<TestgDialogFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestgDialogFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestgDialogFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
