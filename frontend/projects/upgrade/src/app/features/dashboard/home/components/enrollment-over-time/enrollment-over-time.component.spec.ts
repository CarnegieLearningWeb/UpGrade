import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollmentOverTimeComponent } from './enrollment-over-time.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';

xdescribe('EnrollmentOverTimeComponent', () => {
  let component: EnrollmentOverTimeComponent;
  let fixture: ComponentFixture<EnrollmentOverTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EnrollmentOverTimeComponent],
      imports: [TestingModule, NgxChartsModule],
      providers: [ExperimentService],
    }).compileComponents();
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
