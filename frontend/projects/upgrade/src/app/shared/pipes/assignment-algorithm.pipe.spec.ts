import { assignmentAlgorithmPipe } from './assignment-algorithm.pipe';

describe('assignmentAlgorithmPipe', () => {
  const pipe = new assignmentAlgorithmPipe();

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform regular text to title case', () => {
    expect(pipe.transform('hello world')).toBe('Hello World');
  });

  it('should preserve TS in ts configurable', () => {
    expect(pipe.transform('ts configurable')).toBe('TS Configurable');
  });

  it('should preserve UCB', () => {
    expect(pipe.transform('ucb')).toBe('UCB');
  });

  it('should handle empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should handle null', () => {
    expect(pipe.transform(null as any)).toBe(null);
  });
});
