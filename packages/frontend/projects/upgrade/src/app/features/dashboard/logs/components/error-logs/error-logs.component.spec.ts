import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorLogsComponent } from './error-logs.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { LogsService } from '../../../../../core/logs/logs.service';
import { SettingsService } from '../../../../../core/settings/settings.service';
import { TimelineComponent } from '../timeline/timeline.component';
import { ErrorLogPipe } from '../../pipes/error-log.pipe';
import { ExperimentActionMessage } from '../../pipes/experiment-action-message.pipe';
import { SharedModule } from '../../../../../shared/shared.module';

xdescribe('ErrorLogsComponent', () => {
  let component: ErrorLogsComponent;
  let fixture: ComponentFixture<ErrorLogsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorLogsComponent, TimelineComponent, ErrorLogPipe, ExperimentActionMessage],
      imports: [TestingModule, SharedModule],
      providers: [LogsService, SettingsService],
    }).compileComponents();
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
