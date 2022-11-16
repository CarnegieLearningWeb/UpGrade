import { TestBed } from '@angular/core/testing';

import { ExperimentDesignStepperService } from './experiment-design-stepper.service';

describe('ExperimentDesignStepperService', () => {
  let service: ExperimentDesignStepperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExperimentDesignStepperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
