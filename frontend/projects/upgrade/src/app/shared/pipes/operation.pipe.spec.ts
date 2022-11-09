import { OperationPipe } from './operation.pipe';
import { OPERATION_TYPES } from 'upgrade_types';

describe('OperationPipe', () => {
  const operationPipe = new OperationPipe();

  it('should return Mean', () => {
    expect(operationPipe.transform(OPERATION_TYPES.AVERAGE)).toBe('Mean');
  });

  it('should return Count', () => {
    expect(operationPipe.transform(OPERATION_TYPES.COUNT)).toBe('Count');
  });

  it('should return Max', () => {
    expect(operationPipe.transform(OPERATION_TYPES.MAX)).toBe('Max');
  });

  it('should return Median', () => {
    expect(operationPipe.transform(OPERATION_TYPES.MEDIAN)).toBe('Median');
  });

  it('should return Min', () => {
    expect(operationPipe.transform(OPERATION_TYPES.MIN)).toBe('Min');
  });

  it('should return Mode', () => {
    expect(operationPipe.transform(OPERATION_TYPES.MODE)).toBe('Mode');
  });

  it('should return Percentage', () => {
    expect(operationPipe.transform(OPERATION_TYPES.PERCENTAGE)).toBe('Percentage');
  });

  it('should return Standard Deviation', () => {
    expect(operationPipe.transform(OPERATION_TYPES.STDEV)).toBe('Standard Deviation');
  });

  it('should return Sum', () => {
    expect(operationPipe.transform(OPERATION_TYPES.SUM)).toBe('Sum');
  });

  it('should return empty string', () => {
    expect(operationPipe.transform('Other')).toBe('');
  });
});
