import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentDesignComponent } from './experiment-design.component';

describe('ExperimentDesignComponent', () => {
  let component: ExperimentDesignComponent;
  let fixture: ComponentFixture<ExperimentDesignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentDesignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
