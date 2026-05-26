import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { provideMockStore } from '@ngrx/store/testing';

import { ExperimentRootPageComponent } from './experiment-root-page.component';

describe('ExperimentRootPageComponent', () => {
  let component: ExperimentRootPageComponent;
  let fixture: ComponentFixture<ExperimentRootPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ExperimentRootPageComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        TranslateModule.forRoot(),
        StoreModule.forRoot({}),
      ],
      providers: [
        provideMockStore({
          initialState: {
            experiments: {
              ids: [],
              entities: {},
              isLoadingExperiment: false,
              skipExperiment: 0,
              totalExperiments: null,
              searchKey: 'all',
              searchString: null,
              sortKey: null,
              sortAs: null,
              stats: {},
              graphInfo: null,
              graphRange: null,
              isGraphInfoLoading: false,
              allPartitions: null,
              allExperimentNames: null,
              context: [],
            },
            auth: {
              isLoggedIn: false,
              isAuthenticating: false,
              user: null,
            },
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExperimentRootPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the common page component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-common-page')).toBeTruthy();
  });

  it('should render the experiment root page header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-experiment-root-page-header')).toBeTruthy();
  });

  it('should render the experiment root page content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-experiment-root-page-content')).toBeTruthy();
  });
});
