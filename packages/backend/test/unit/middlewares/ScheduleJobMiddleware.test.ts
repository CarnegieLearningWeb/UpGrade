import { NextFunction } from 'express';
import { ScheduleJobMiddleware } from '../../../src/api/middlewares/ScheduleJobMiddleware';
import { SERVER_ERROR } from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import jwt from 'jsonwebtoken';

describe('ScheduleJob Middleware tests', () => {
  let mockRequest: any;
  let mockResponse: any;
  const nextFunction: NextFunction = jest.fn();
  const schedulelib = new ScheduleJobMiddleware();

  let mockjson: any;

  beforeEach(() => {
    mockjson = (error) => (mockResponse.body = error.message);

    mockRequest = {
      header: jest.fn(),
      logger: new UpgradeLogger(),
      get: jest.fn(),
    };

    mockResponse = {
      json: jest.fn(mockjson),
      status: jest.fn(),
      statusCode: 200,
      headersSent: false,
      body: {},
    };
  });

  test('JWT Expired error test', async () => {
    const error = new Error();
    error.message = 'jwt expired';
    mockRequest.header = jest.fn(() => {
      throw error;
    });
    expect(() => {
      schedulelib.use(mockRequest, mockResponse, nextFunction);
    }).toThrow(error);
  });

  test('Invalid token error test', async () => {
    const error = new Error();
    error.message = 'invalid token';
    mockRequest.header = jest.fn(() => {
      throw error;
    });
    expect(() => {
      schedulelib.use(mockRequest, mockResponse, nextFunction);
    }).toThrow(error);
  });

  test('Auth Check no token test', async () => {
    const error = new Error('Token is not present in request header');
    (error as any).type = SERVER_ERROR.TOKEN_NOT_PRESENT;
    expect(() => {
      schedulelib.use(mockRequest, mockResponse, nextFunction);
    }).toThrow(error);
  });

  test('Auth Check no token test', async () => {
    const headerAuth = (x) => {
      return x + ' Bearer abd';
    };
    mockRequest.header = headerAuth;
    const getSessionId = (x) => {
      return x + ' 123';
    };
    mockRequest.get = getSessionId;

    const verify = jest.spyOn(jwt, 'verify');
    verify.mockImplementation(() => () => ({ verified: 'true' }));
    const error = new Error('Provided token is invalid');
    (error as any).type = SERVER_ERROR.INVALID_TOKEN;
    expect(() => {
      schedulelib.use(mockRequest, mockResponse, nextFunction);
    }).toThrow(error);
  });
});
