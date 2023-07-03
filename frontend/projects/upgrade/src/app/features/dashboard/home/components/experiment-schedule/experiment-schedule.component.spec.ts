import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentScheduleComponent } from './experiment-schedule.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';

xdescribe('ExperimentScheduleComponent', () => {
  let component: ExperimentScheduleComponent;
  let fixture: ComponentFixture<ExperimentScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentScheduleComponent],
      imports: [TestingModule, OwlDateTimeModule, OwlNativeDateTimeModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
