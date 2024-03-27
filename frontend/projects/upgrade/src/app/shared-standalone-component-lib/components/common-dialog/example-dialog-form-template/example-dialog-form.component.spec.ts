import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExampleDialogFormTemplateComponent } from './example-dialog-form.component';

describe('TestgDialogFormComponent', () => {
  let component: ExampleDialogFormTemplateComponent;
  let fixture: ComponentFixture<ExampleDialogFormTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleDialogFormTemplateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleDialogFormTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
