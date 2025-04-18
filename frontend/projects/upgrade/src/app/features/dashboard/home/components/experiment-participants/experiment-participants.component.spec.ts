import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentParticipantsComponent } from './experiment-participants.component';

xdescribe('ExperimentParticipantsComponent', () => {
  let component: ExperimentParticipantsComponent;
  let fixture: ComponentFixture<ExperimentParticipantsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentParticipantsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentParticipantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
