import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';
import { TestingModule } from '../../../../../testing/testing.module';
import { ExperimentListComponent } from '../components/experiment-list/experiment-list.component';
import { ExperimentService } from '../../../../core/experiments/experiments.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

xdescribe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent, ExperimentListComponent],
      imports: [TestingModule, NgxSkeletonLoaderModule],
      providers: [ExperimentService, AuthService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
