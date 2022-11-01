import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineComponent } from './timeline.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { ErrorLogPipe } from '../../pipes/error-log.pipe';
import { ExperimentActionMessage } from '../../pipes/experiment-action-message.pipe';

xdescribe('TimelineComponent', () => {
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TimelineComponent, ErrorLogPipe, ExperimentActionMessage],
      imports: [TestingModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
