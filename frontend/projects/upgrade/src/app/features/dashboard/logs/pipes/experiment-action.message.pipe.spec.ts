import { EXPERIMENT_LOG_TYPE } from 'upgrade_types';
import { ExperimentActionMessage } from './experiment-action-message.pipe';

describe('ExperimentActionMessage', () => {
  const experimentActionMessagePipe = new ExperimentActionMessage();

  it('should return translation string of EXPERIMENT_CREATED', () => {
    expect(experimentActionMessagePipe.transform(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED)).toBe(
      'logs.audit-log-experiment-created.text'
    );
  });

  it('should return translation string of EXPERIMENT_DELETED', () => {
    expect(experimentActionMessagePipe.transform(EXPERIMENT_LOG_TYPE.EXPERIMENT_DELETED)).toBe(
      'logs.audit-log-experiment-deleted.text'
    );
  });

  it('should return translation string of EXPERIMENT_STATE_CHANGED', () => {
    expect(experimentActionMessagePipe.transform(EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED)).toBe(
      'logs.audit-log-experiment-state-changed.text'
    );
  });

  it('should return translation string of EXPERIMENT_UPDATED', () => {
    expect(experimentActionMessagePipe.transform(EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED)).toBe(
      'logs.audit-log-experiment-updated.text'
    );
  });

  it('should return translation string of EXPERIMENT_DATA_EXPORTED', () => {
    expect(experimentActionMessagePipe.transform(EXPERIMENT_LOG_TYPE.EXPERIMENT_DATA_EXPORTED)).toBe(
      'logs.audit-log-experiment-data-exported.text'
    );
  });

  it('should return translation string of EXPERIMENT_DATA_REQUESTED', () => {
    expect(experimentActionMessagePipe.transform(EXPERIMENT_LOG_TYPE.EXPERIMENT_DATA_REQUESTED)).toBe(
      'logs.audit-log-experiment-data-requested.text'
    );
  });
});
