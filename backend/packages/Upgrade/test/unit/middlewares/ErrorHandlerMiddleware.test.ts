import { NextFunction, Response } from 'express';
import { ErrorHandlerMiddleware } from '../../../src/api/middlewares/ErrorHandlerMiddleware';
import { SERVER_ERROR } from 'upgrade_types';

import Container from 'typedi';
import ErrorServiceMock from '../controllers/mocks/ErrorServiceMock';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

describe('ErrorHandler Middleware tests', () => {
  let mockRequest: any;
  let mockResponse: any;
  const nextFunction: NextFunction = jest.fn();
  let errorhandler: ErrorHandlerMiddleware;

  let mockjson: any;

  beforeAll(() => {
    Container.set(ErrorService, new ErrorServiceMock());
    errorhandler = new ErrorHandlerMiddleware(Container.get(ErrorService));
    mockjson = (error) => (mockResponse.body = error.message);
  });

  beforeEach(() => {
    mockRequest = {
      header: jest.fn(),
      logger: new UpgradeLogger(),
    };

    mockResponse = {
      json: jest.fn(mockjson),
      status: jest.fn(),
      statusCode: 200,
      headersSent: false,
      body: {},
    };
  });

  test('Incorrect param error test', async () => {
    const error = {
      type: SERVER_ERROR.INCORRECT_PARAM_FORMAT,
      message: 'Incorrect Parameters',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Missing param error test', async () => {
    const error = {
      type: SERVER_ERROR.MISSING_PARAMS,
      message: 'Missing Parameters',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Query failed error test', async () => {
    const error = {
      type: SERVER_ERROR.QUERY_FAILED,
      message: 'Query failed',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Experiment user not defined error test', async () => {
    const error = {
      type: SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED,
      message: 'Experiment user not defined',
      httpCode: 404,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Experiment user group not defined error test', async () => {
    const error = {
      type: SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED,
      message: 'Experiment user group not defined',
      httpCode: 404,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Assignment error test', async () => {
    const error = {
      type: SERVER_ERROR.ASSIGNMENT_ERROR,
      message: 'Assignment error',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Working group not subset of group error test', async () => {
    const error = {
      type: SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP,
      message: 'Working group not subset of group error',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Invalid token error test', async () => {
    const error = {
      type: SERVER_ERROR.INVALID_TOKEN,
      message: 'Invalid token error',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Token not present error test', async () => {
    const error = {
      type: SERVER_ERROR.TOKEN_NOT_PRESENT,
      message: 'Token not present error',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Condition not found error test', async () => {
    const error = {
      type: SERVER_ERROR.CONDITION_NOT_FOUND,
      message: 'Condition not found error',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Email send error test', async () => {
    const error = {
      type: SERVER_ERROR.EMAIL_SEND_ERROR,
      message: 'Email send error',
      httpCode: 500,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Incorrect param format error test', async () => {
    const error = {
      message: 'Incorrect param format error',
      httpCode: 400,
    };
    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('User not found error test', async () => {
    const error = {
      message: 'User not found errors',
      httpCode: 401,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Query failed error test', async () => {
    const error = {
      message: 'Query failed error',
      httpCode: 404,
    };

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(error.httpCode);
    expect(mockResponse.body).toBe(error.message);
  });

  test('Default error test', async () => {
    const error = {};

    await errorhandler.error(error, mockRequest, mockResponse as Response, nextFunction);
    expect(mockResponse.statusCode).toBe(500);
  });
});
