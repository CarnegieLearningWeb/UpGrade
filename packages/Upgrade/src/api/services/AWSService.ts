import AWS from 'aws-sdk';
import { env } from '../../env';
import { Service } from 'typedi';
import { PromiseResult } from 'aws-sdk/lib/request';

interface StepFunctionStartInput {
  stateMachineArn: string;
  input: string;
}

interface StepFunctionStopInput {
  executionArn: string;
}

const stepFunction = new AWS.StepFunctions({
  region: env.aws.region,
});

@Service()
export class AWSService {
  public stepFunctionStartExecution(
    experimentSchedularStateMachine: StepFunctionStartInput
  ): Promise<PromiseResult<AWS.StepFunctions.StartExecutionOutput, AWS.AWSError>> {
    return stepFunction.startExecution(experimentSchedularStateMachine).promise();
  }

  public stepFunctionStopExecution(
    stopInput: StepFunctionStopInput
  ): Promise<PromiseResult<AWS.StepFunctions.StopExecutionOutput, AWS.AWSError>> {
    return stepFunction.stopExecution(stopInput).promise();
  }
}
