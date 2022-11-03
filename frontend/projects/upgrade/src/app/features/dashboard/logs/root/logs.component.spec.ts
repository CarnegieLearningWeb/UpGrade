import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogsComponent } from './logs.component';
import { TestingModule } from '../../../../../testing/testing.module';
import { AuditLogsComponent } from '../components/audit-logs/audit-logs.component';
import { ErrorLogsComponent } from '../components/error-logs/error-logs.component';
import { LogsService } from '../../../../core/logs/logs.service';
import { TimelineComponent } from '../components/timeline/timeline.component';
import { LogDateFormatPipe } from '../pipes/logs-date-format.pipe';
import { ErrorLogPipe } from '../pipes/error-log.pipe';
import { ExperimentActionMessage } from '../pipes/experiment-action-message.pipe';
import { SettingsService } from '../../../../core/settings/settings.service';

xdescribe('LogsComponent', () => {
  let component: LogsComponent;
  let fixture: ComponentFixture<LogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        LogsComponent,
        AuditLogsComponent,
        ErrorLogsComponent,
        TimelineComponent,
        LogDateFormatPipe,
        ErrorLogPipe,
        ExperimentActionMessage,
      ],
      imports: [TestingModule],
      providers: [LogsService, SettingsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
