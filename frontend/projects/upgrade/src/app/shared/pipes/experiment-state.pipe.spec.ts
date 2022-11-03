import { ExperimentStatePipe, ExperimentStatePipeType } from './experiment-state.pipe';
import { EXPERIMENT_STATE } from 'upgrade_types';

describe('ExperimentStatePipe', () => {
  const experimentStatePipe = new ExperimentStatePipe();

  it('should return Preview State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.PREVIEW)).toBe('Preview');
  });

  it('should return Scheduled State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.SCHEDULED)).toBe('Scheduled');
  });

  it('should return Cancelled State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.CANCELLED)).toBe('Cancelled');
  });

  it('should return Enrolling State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.ENROLLING)).toBe('Enrolling');
  });

  it('should return Enrollment Complete State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.ENROLLMENT_COMPLETE)).toBe('Enrollment Complete');
  });

  it('should return Inactive State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.INACTIVE)).toBe('Inactive');
  });

  it('should return #000 color for Preview State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.PREVIEW, ExperimentStatePipeType.COLOR)).toBe('#000');
  });

  it('should return #000 color for Scheduled State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.SCHEDULED, ExperimentStatePipeType.COLOR)).toBe('#000');
  });

  it('should return #ff0000 color for Cancelled State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.CANCELLED, ExperimentStatePipeType.COLOR)).toBe('#ff0000');
  });

  it('should return #7b9cff color for Enrolling State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.ENROLLING, ExperimentStatePipeType.COLOR)).toBe('#7b9cff');
  });

  it('should return #0cdda5 color for Enrollment Complete State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.ENROLLMENT_COMPLETE, ExperimentStatePipeType.COLOR)).toBe(
      '#0cdda5'
    );
  });

  it('should return #d8d8d8 color for Inactive State', () => {
    expect(experimentStatePipe.transform(EXPERIMENT_STATE.INACTIVE, ExperimentStatePipeType.COLOR)).toBe('#d8d8d8');
  });
});
