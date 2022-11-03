import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditLogsComponent } from './audit-logs.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { SettingsService } from '../../../../../core/settings/settings.service';
import { LogsService } from '../../../../../core/logs/logs.service';
import { TimelineComponent } from '../timeline/timeline.component';
import { LogDateFormatPipe } from '../../pipes/logs-date-format.pipe';
import { ErrorLogPipe } from '../../pipes/error-log.pipe';
import { ExperimentActionMessage } from '../../pipes/experiment-action-message.pipe';

xdescribe('AuditLogsComponent', () => {
  let component: AuditLogsComponent;
  let fixture: ComponentFixture<AuditLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AuditLogsComponent, TimelineComponent, LogDateFormatPipe, ErrorLogPipe, ExperimentActionMessage],
      imports: [TestingModule],
      providers: [SettingsService, LogsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
