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

const s3 = new AWS.S3({
  region: env.aws.region,
});

const ses = new AWS.SES({
  region: env.aws.region,
});

@Service()
export class AWSService {
  public stepFunctionStartExecution(
    experimentSchedulerStateMachine: StepFunctionStartInput
  ): Promise<PromiseResult<AWS.StepFunctions.StartExecutionOutput, AWS.AWSError>> {
    return stepFunction.startExecution(experimentSchedulerStateMachine).promise();
  }

  public stepFunctionStopExecution(
    stopInput: StepFunctionStopInput
  ): Promise<PromiseResult<AWS.StepFunctions.StopExecutionOutput, AWS.AWSError>> {
    return stepFunction.stopExecution(stopInput).promise();
  }

  public uploadCSV(fileBuffer: Buffer, bucketName: string, key: string): Promise<AWS.S3.ManagedUpload.SendData> {
    return s3
      .upload({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
      })
      .promise();
  }

  public generateSignedURL(bucketName: string, key: string, expires: number): Promise<string> {
    const params = { Bucket: bucketName, Key: key, Expires: expires };
    return new Promise((resolve, reject) => {
      s3.getSignedUrl('getObject', params, async (err, url) => {
        if (err) {
          reject(err);
        }
        return resolve(url);
      });
    });
  }

  public sendEmail(
    fromAddress: string,
    toAddress: string,
    text: string,
    subject: string
  ): Promise<PromiseResult<AWS.SES.SendEmailResponse, AWS.AWSError>> {
    const param = {
      Destination: {
        ToAddresses: [toAddress],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: text,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: fromAddress,
    };

    return ses.sendEmail(param).promise();
  }
}
