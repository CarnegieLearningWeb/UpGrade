import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorLogsComponent } from './error-logs.component';

describe('ErrorLogsComponent', () => {
  let component: ErrorLogsComponent;
  let fixture: ComponentFixture<ErrorLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ErrorLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
