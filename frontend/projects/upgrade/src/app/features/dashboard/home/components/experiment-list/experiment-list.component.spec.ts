import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentListComponent } from './experiment-list.component';
import { TestingModule } from '../../../../../../testing/testing.module';
import { AuthService } from '../../../../../core/auth/auth.service';
import { ExperimentService } from '../../../../../core/experiments/experiments.service';
import { SettingsService } from '../../../../../core/settings/settings.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

xdescribe('ExperimentListComponent', () => {
  let component: ExperimentListComponent;
  let fixture: ComponentFixture<ExperimentListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExperimentListComponent],
      imports: [TestingModule, NgxSkeletonLoaderModule],
      providers: [ExperimentService, AuthService, SettingsService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
