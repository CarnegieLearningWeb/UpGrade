import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { CompleteMultipartUploadCommandOutput, GetObjectCommand, S3 } from '@aws-sdk/client-s3';
import { SES, SendEmailCommandOutput } from '@aws-sdk/client-ses';
import { SFN, StartExecutionCommandOutput, StopExecutionCommandOutput } from '@aws-sdk/client-sfn';
import { env } from '../../env';
import { Service } from 'typedi';

interface StepFunctionStartInput {
  stateMachineArn: string;
  input: string;
}

interface StepFunctionStopInput {
  executionArn: string;
}

const stepFunction = new SFN({
  region: env.aws.region,
});

const s3 = new S3({
  region: env.aws.region,
});

const ses = new SES({
  region: env.aws.region,
});

@Service()
export class AWSService {
  public stepFunctionStartExecution(
    experimentSchedulerStateMachine: StepFunctionStartInput
  ): Promise<StartExecutionCommandOutput> {
    return stepFunction.startExecution(experimentSchedulerStateMachine);
  }

  public stepFunctionStopExecution(stopInput: StepFunctionStopInput): Promise<StopExecutionCommandOutput> {
    return stepFunction.stopExecution(stopInput);
  }

  public uploadCSV(fileBuffer: Buffer, bucketName: string, key: string): Promise<CompleteMultipartUploadCommandOutput> {
    return new Upload({
      client: s3,

      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
      },
    }).done();
  }

  public generateSignedURL(bucketName: string, key: string, expires: number): Promise<string> {
    // TODO: Check if it is working
    const params = { Bucket: bucketName, Key: key };
    return getSignedUrl(s3, new GetObjectCommand(params), {
      expiresIn: expires,
    });
  }

  public sendEmail(
    fromAddress: string,
    toAddress: string,
    text: string,
    subject: string
  ): Promise<SendEmailCommandOutput> {
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

    return ses.sendEmail(param);
  }
}
