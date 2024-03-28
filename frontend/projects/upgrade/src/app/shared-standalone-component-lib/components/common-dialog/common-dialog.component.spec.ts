import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonDialogComponent } from './common-dialog.component';

xdescribe('CommonDialogComponent', () => {
  let component: CommonDialogComponent;
  let fixture: ComponentFixture<CommonDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
