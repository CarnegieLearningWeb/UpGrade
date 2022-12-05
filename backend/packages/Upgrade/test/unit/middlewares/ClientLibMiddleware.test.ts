import { NextFunction } from 'express';
import { ClientLibMiddleware } from '../../../src/api/middlewares/ClientLibMiddleware';
import { SettingService } from '../../../src/api/services/SettingService';
import SettingServiceMock from '../controllers/mocks/SettingServiceMock';
import jwt from 'jsonwebtoken';
import Container from 'typedi';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { Setting } from '../../../src/api/models/Setting';

class SettingServiceAuthCheck {
  public getClientCheck(logger: UpgradeLogger): Promise<Setting> {
    const defaultSetting = new Setting();
    defaultSetting.toCheckAuth = true;
    defaultSetting.toFilterMetric = false;
    return Promise.resolve(defaultSetting);
  }
}

describe('ClientLib Middleware tests', () => {
  let mockRequest: any;
  let mockResponse: any;
  const nextFunction: NextFunction = jest.fn();
  let clientlib: ClientLibMiddleware;
  // let error = SERVER_ERROR;
  let mockjson: any;

  beforeEach(() => {
    Container.set(SettingService, new SettingServiceMock());
    clientlib = new ClientLibMiddleware(Container.get(SettingService));
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
    await expect(clientlib.use(mockRequest, mockResponse, nextFunction)).rejects.toThrow(error);
  });

  test('Invalid token error test', async () => {
    const error = new Error();
    error.message = 'invalid token';
    mockRequest.header = jest.fn(() => {
      throw error;
    });
    await expect(clientlib.use(mockRequest, mockResponse, nextFunction)).rejects.toThrow(error);
  });

  test('No Auth check test', async () => {
    await clientlib.use(mockRequest, mockResponse, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  test('Auth Check no token test', async () => {
    Container.set(SettingService, new SettingServiceAuthCheck());
    clientlib = new ClientLibMiddleware(Container.get(SettingService));

    await expect(clientlib.use(mockRequest, mockResponse, nextFunction)).rejects.toThrow(
      'Token is not present in request header from client'
    );
  });

  test('Auth Check no token test', async () => {
    Container.set(SettingService, new SettingServiceAuthCheck());
    clientlib = new ClientLibMiddleware(Container.get(SettingService));
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

    await expect(clientlib.use(mockRequest, mockResponse, nextFunction)).rejects.toThrow('Provided token is invalid');
  });
});
