import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentUsersRootComponent } from './experiment-users-root.component';

describe('UserRootComponent', () => {
  let component: ExperimentUsersRootComponent;
  let fixture: ComponentFixture<ExperimentUsersRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentUsersRootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentUsersRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
