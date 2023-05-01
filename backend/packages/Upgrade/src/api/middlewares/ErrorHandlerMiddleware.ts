import * as express from 'express';
import { ExpressErrorMiddlewareInterface, Middleware } from 'routing-controllers';

import { env } from '../../env';
import { ErrorService } from '../services/ErrorService';
import { ExperimentError } from '../models/ExperimentError';
import { SERVER_ERROR } from 'upgrade_types';

@Middleware({ type: 'after' })
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
  public isProduction = env.isProduction;

  constructor(public errorService: ErrorService) {}

  public async error(
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    // It seems like some decorators handle setting the response (i.e. class-validators)
    let message: string;
    let type: SERVER_ERROR;

    let errorType;
    let errorMessage;
    try {
      errorType = error.type;
      errorMessage = error.message;
    } catch {
      errorType = undefined;
    }

    // switch case according to error type
    switch (errorType) {
      case SERVER_ERROR.INCORRECT_PARAM_FORMAT:
        type = SERVER_ERROR.INCORRECT_PARAM_FORMAT;
        message = errorMessage;
        break;
      case SERVER_ERROR.MISSING_PARAMS:
        type = SERVER_ERROR.MISSING_PARAMS;
        message = errorMessage;
        break;
      case SERVER_ERROR.QUERY_FAILED:
        type = SERVER_ERROR.QUERY_FAILED;
        message = errorMessage;
        break;
      case SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED:
        type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
        message = errorMessage;
        break;
      case SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED:
        type = SERVER_ERROR.EXPERIMENT_USER_GROUP_NOT_DEFINED;
        message = errorMessage;
        break;
      case SERVER_ERROR.ASSIGNMENT_ERROR:
        type = SERVER_ERROR.ASSIGNMENT_ERROR;
        message = errorMessage;
        break;
      case SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP:
        type = SERVER_ERROR.WORKING_GROUP_NOT_SUBSET_OF_GROUP;
        message = errorMessage;
        break;
      case SERVER_ERROR.INVALID_TOKEN:
        type = SERVER_ERROR.INVALID_TOKEN;
        message = errorMessage;
        break;
      case SERVER_ERROR.TOKEN_NOT_PRESENT:
        type = SERVER_ERROR.TOKEN_NOT_PRESENT;
        message = errorMessage;
        break;
      case SERVER_ERROR.CONDITION_NOT_FOUND:
        type = SERVER_ERROR.CONDITION_NOT_FOUND;
        message = errorMessage;
        break;
      case SERVER_ERROR.EMAIL_SEND_ERROR:
        type = SERVER_ERROR.EMAIL_SEND_ERROR;
        message = errorMessage;
        break;
      default:
        switch (error.httpCode) {
          case 400:
            message = error.message;
            type = SERVER_ERROR.INCORRECT_PARAM_FORMAT;
            break;
          case 401:
            message = error.message;
            type = SERVER_ERROR.USER_NOT_FOUND;
            break;
          case 404:
            message = error.message;
            type = SERVER_ERROR.QUERY_FAILED;
            break;
          case 422:
            message = error.message;
            type = SERVER_ERROR.UNSUPPORTED_CALIPER
            break;
          default:
            message = error.message;
            break;
        }
        break;
    }

    // making error document
    const experimentError = new ExperimentError();
    experimentError.name = error.name;
    experimentError.message = message;
    experimentError.endPoint = req.originalUrl;
    experimentError.errorCode = error.httpCode;
    experimentError.type = type;
    req.logger.error(experimentError);
    experimentError.type ? await this.errorService.create(experimentError, req.logger) : await Promise.resolve(error);
    if (!res.headersSent) {
      res.statusCode = error.httpCode || 500;
      res.json(error);
      next(error);
    }
  }
}
