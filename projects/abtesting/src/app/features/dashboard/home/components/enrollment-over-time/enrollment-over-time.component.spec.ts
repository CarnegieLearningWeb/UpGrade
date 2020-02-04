import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentOverTimeComponent } from './enrollment-over-time.component';

describe('EnrollmentOverTimeComponent', () => {
  let component: EnrollmentOverTimeComponent;
  let fixture: ComponentFixture<EnrollmentOverTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnrollmentOverTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollmentOverTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
