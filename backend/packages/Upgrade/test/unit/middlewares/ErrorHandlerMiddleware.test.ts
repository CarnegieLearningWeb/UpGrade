import { NextFunction, Response } from 'express';
import { ErrorHandlerMiddleware } from '../../../src/api/middlewares/ErrorHandlerMiddleware';
import { AppRequest } from 'upgrade_types';
import { SERVER_ERROR } from 'upgrade_types';

import Container from 'typedi';
import ErrorServiceMock from '../controllers/mocks/ErrorServiceMock';
import { ErrorService } from '../../../src/api/services/ErrorService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';


describe('ErrorHandler Middleware tests', () => {
    let mockRequest: any;
    let mockResponse: any;
    let nextFunction: NextFunction = jest.fn();
    let errorhandler: ErrorHandlerMiddleware;

    let mockjson: any;

    beforeAll(() => {
        Container.set(ErrorService, new ErrorServiceMock());
        errorhandler = new ErrorHandlerMiddleware(Container.get(ErrorService));
        mockjson = error => mockResponse.body = error.message;
    }

    beforeEach(() => {
        mockRequest = {
            header: jest.fn(),
            logger: new UpgradeLogger()
        };
      
        mockResponse = {
            json: jest.fn(mockjson),
            status: jest.fn(),
            statusCode: 200,
            headersSent: false,
            body: {}
          };
    });

    test('Incorrect param error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.INCORRECT_PARAM_FORMAT;
        error.message="Incorrect Parameters"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Missing param error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.MISSING_PARAMS;
        error.message="Missing Parameters"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Query failed error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.QUERY_FAILED;
        error.message="Query failed"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Experiment user not defined error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
        error.message="Experiment user not defined"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Experiment user group not defined error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED;
        error.message="Experiment user group not defined"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Assignment error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.ASSIGNMENT_ERROR;
        error.message="Assignment error"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Working group not subset of group error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP;
        error.message="Working group not subset of group error"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Invalid token error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.INVALID_TOKEN;
        error.message="Invalid token error"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Token not present error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.TOKEN_NOT_PRESENT;
        error.message="Token not present error"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Condition not found error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.CONDTION_NOT_FOUND;
        error.message="Condition not found error"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Email send error test', async () => {
        let error = SERVER_ERROR;

        error.type= SERVER_ERROR.EMAIL_SEND_ERROR;
        error.message="Email send error"
        error.httpCode = 500;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Incorrect param format error test', async () => {
        let error = SERVER_ERROR;
        error.type=undefined;
        error.message="Incorrect param format error"
        error.httpCode = 400;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('User not found error test', async () => {
        let error = SERVER_ERROR;
        error.type=undefined;
        error.message="User not found error"
        error.httpCode = 401;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Query failed error test', async () => {
        let error = SERVER_ERROR;
        error.type=undefined;
        error.message="Query failed error"
        error.httpCode = 404;

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(error.httpCode);
        expect(mockResponse.body).toBe(error.message);
    })

    test('Default error test', async () => {
        let error= {};

        await errorhandler.error(error, mockRequest as AppRequest, mockResponse as Response, nextFunction);
        expect(mockResponse.statusCode).toBe(500);
    })

});