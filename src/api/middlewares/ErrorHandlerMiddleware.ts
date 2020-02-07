import * as express from 'express';
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from 'routing-controllers';

import { Logger, LoggerInterface } from '../../decorators/Logger';
import { env } from '../../env';
import { formatBadReqErrorMessage } from '../../lib/env/utils';
import { ErrorService } from '../services/ErrorService';
import { ExperimentError } from '../models/ExperimentError';
import { SERVER_ERROR } from 'ees_types';

@Middleware({ type: 'after' })
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
  public isProduction = env.isProduction;

  constructor(@Logger(__filename) private log: LoggerInterface, public errorService: ErrorService) {}

  public async error(
    error: HttpError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    // It seems like some decorators handle setting the response (i.e. class-validators)

    let message: string;
    let type: SERVER_ERROR;
    switch (error.httpCode) {
      case 400:
        message = formatBadReqErrorMessage(error[`errors`]);
        type = SERVER_ERROR.INCORRECT_PARAM_FORMAT;
        break;
      case 401:
        message = error.message;
        type = SERVER_ERROR.USER_NOT_FOUND;
        break;
      default:
        message = error.message;
        break;
    }

    const experimentError = new ExperimentError();

    experimentError.name = error.name;
    experimentError.message = message;
    experimentError.endPoint = req.originalUrl;
    experimentError.errorCode = error.httpCode;
    experimentError.type = type;

    await this.errorService.create(experimentError);

    if (!res.headersSent) {
      res.status(error.httpCode || 500);

      res.json({
        name: error.name,
        message: `${message}`,
        errors: error[`errors`] || [],
      });
    }

    if (this.isProduction) {
      this.log.error(error.name, error.message);
    } else {
      this.log.error(error.name, error.stack);
    }
  }
}
