import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  const truncatePipe = new TruncatePipe();

  it('should return Experiment', () => {
    expect(truncatePipe.transform('Experiment', 10)).toBe('Experiment');
  });

  it('should return Experiment...', () => {
    expect(truncatePipe.transform('Experimentation System', 10)).toBe('Experiment...');
  });

  it('should return Experiment.....', () => {
    expect(truncatePipe.transform('Experimentation System', 10, 5)).toBe('Experiment.....');
  });
});
