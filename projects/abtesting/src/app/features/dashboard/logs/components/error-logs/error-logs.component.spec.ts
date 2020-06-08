import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorLogsComponent } from './error-logs.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { LogsService } from '../../../../../core/logs/logs.service';
import { SettingsService } from '../../../../../core/settings/settings.service';
import { TimelineComponent } from '../timeline/timeline.component';
import { LogDateFormatPipe } from '../../pipes/logs-date-format.pipe';
import { ErrorLogPipe } from '../../pipes/error-log.pipe';

describe('ErrorLogsComponent', () => {
  let component: ErrorLogsComponent;
  let fixture: ComponentFixture<ErrorLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorLogsComponent, TimelineComponent, LogDateFormatPipe, ErrorLogPipe],
      imports: [TestingModule],
      providers: [LogsService, SettingsService]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
