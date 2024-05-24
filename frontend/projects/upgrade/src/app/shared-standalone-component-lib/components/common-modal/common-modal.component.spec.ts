import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonModalComponent } from './common-modal.component';

xdescribe('CommonDialogComponent', () => {
  let component: CommonModalComponent;
  let fixture: ComponentFixture<CommonModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
