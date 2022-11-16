import { Service } from 'typedi';
import uuid from 'uuid/v4';

@Service()
export default class AWSServiceMock {
  public stepFunctionStartExecution(timeStamp: Date, body: any): Promise<any> {
    return Promise.resolve({
      executionArn: uuid(),
      startDate: Date.now(),
    });
  }

  public stepFunctionStopExecution(executionArn: string): Promise<any> {
    return Promise.resolve({
      stopDate: Date.now(),
    });
  }

  public sendEmail(fromAddress: string, toAddress: string, text: string, subject: string): Promise<any> {
    return Promise.resolve({});
  }
}
