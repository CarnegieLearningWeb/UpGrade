import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentUsersComponent } from './experiment-users.component';

describe('ExperimentUsersComponent', () => {
  let component: ExperimentUsersComponent;
  let fixture: ComponentFixture<ExperimentUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentUsersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
