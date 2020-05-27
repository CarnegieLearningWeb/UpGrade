import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FlagOverviewComponent } from './flag-overview.component';

describe('FlagOverviewComponent', () => {
  let component: FlagOverviewComponent;
  let fixture: ComponentFixture<FlagOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FlagOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlagOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
