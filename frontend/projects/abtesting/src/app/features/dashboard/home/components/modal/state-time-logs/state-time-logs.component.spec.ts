import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StateTimeLogsComponent } from './state-time-logs.component';

describe('StateTimeLogsComponent', () => {
  let component: StateTimeLogsComponent;
  let fixture: ComponentFixture<StateTimeLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StateTimeLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateTimeLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
