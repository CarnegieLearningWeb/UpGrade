import { SERVER_ERROR } from 'upgrade_types';
import { ErrorLogPipe } from './error-log.pipe';

describe('ErrorLogPipe', () => {
  const errorLogPipe = new ErrorLogPipe();

  it('should return light-blue class when error is DB_AUTH_FAIL', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.DB_AUTH_FAIL, 'class')).toBe('light-blue');
  });

  it('should return shield icon when error is DB_AUTH_FAIL', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.DB_AUTH_FAIL, 'icon')).toBe('shield');
  });

  it('should return light-blue class when error is DB_UNREACHABLE', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.DB_UNREACHABLE, 'class')).toBe('light-blue');
  });

  it('should return shield icon when error is DB_UNREACHABLE', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.DB_UNREACHABLE, 'icon')).toBe('shield');
  });

  it('should return red class when error is ASSIGNMENT_ERROR', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.ASSIGNMENT_ERROR, 'class')).toBe('red');
  });

  it('should return cancel icon when error is ASSIGNMENT_ERROR', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.ASSIGNMENT_ERROR, 'icon')).toBe('cancel');
  });

  it('should return red class when error is QUERY_FAILED', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.QUERY_FAILED, 'class')).toBe('red');
  });

  it('should return database icon when error is QUERY_FAILED', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.QUERY_FAILED, 'icon')).toBe('database');
  });

  it('should return red class when error is INCORRECT_PARAM_FORMAT', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.INCORRECT_PARAM_FORMAT, 'class')).toBe('red');
  });

  it('should return database icon when error is INCORRECT_PARAM_FORMAT', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.INCORRECT_PARAM_FORMAT, 'icon')).toBe('database');
  });

  it('should return red class when error is MISSING_PARAMS', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.MISSING_PARAMS, 'class')).toBe('red');
  });

  it('should return database icon when error is MISSING_PARAMS', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.MISSING_PARAMS, 'icon')).toBe('database');
  });

  it('should return red class when error is INVALID_TOKEN', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.INVALID_TOKEN, 'class')).toBe('red');
  });

  it('should return database icon when error is INVALID_TOKEN', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.INVALID_TOKEN, 'icon')).toBe('database');
  });

  it('should return red class when error is TOKEN_NOT_PRESENT', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.TOKEN_NOT_PRESENT, 'class')).toBe('red');
  });

  it('should return database icon when error is TOKEN_NOT_PRESENT', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.TOKEN_NOT_PRESENT, 'icon')).toBe('database');
  });

  it('should return yellow class when error is USER_NOT_FOUND', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.USER_NOT_FOUND, 'class')).toBe('yellow');
  });

  it('should return user-2 icon when error is USER_NOT_FOUND', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.USER_NOT_FOUND, 'icon')).toBe('user-2');
  });

  it('should return yellow class when error is REPORTED_ERROR', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.REPORTED_ERROR, 'class')).toBe('yellow');
  });

  it('should return user-2 icon when error is REPORTED_ERROR', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.REPORTED_ERROR, 'icon')).toBe('user-2');
  });

  it('should return yellow class when error is EXPERIMENT_USER_NOT_DEFINED', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED, 'class')).toBe('yellow');
  });

  it('should return user-2 icon when error is EXPERIMENT_USER_NOT_DEFINED', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED, 'icon')).toBe('user-2');
  });

  it('should return yellow class when error is EXPERIMENT_USER_GROUP_NOT_DEFINED', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED, 'class')).toBe('yellow');
  });

  it('should return user-2 icon when error is EXPERIMENT_USER_GROUP_NOT_DEFINED', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED, 'icon')).toBe('user-2');
  });

  it('should return yellow class when error is WORKING_GROUP_NOT_SUBSET_OF_GROUP', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP, 'class')).toBe('yellow');
  });

  it('should return user-2 icon when error is WORKING_GROUP_NOT_SUBSET_OF_GROUP', () => {
    expect(errorLogPipe.transform(SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP, 'icon')).toBe('user-2');
  });

  it('should return red class when error is any other string', () => {
    expect(errorLogPipe.transform('other' as any, 'class')).toBe('red');
  });

  it('should return database icon when error is any other string', () => {
    expect(errorLogPipe.transform('other' as any, 'icon')).toBe('database');
  });
});
