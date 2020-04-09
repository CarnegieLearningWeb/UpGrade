import * as express from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import * as jwt from 'jsonwebtoken';
import isequal from 'lodash.isequal';
import { env } from '../../env';
import { LoggerInterface, Logger } from '../../decorators/Logger';
import { SERVER_ERROR } from 'ees_types';

export class ScheduleJobMiddleware implements ExpressMiddlewareInterface {

  constructor(@Logger(__filename) private log: LoggerInterface) { }

  public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
    try {
      const authorization = req.header('authorization');
      const token = authorization && authorization.replace('Bearer ', '').trim();
      if (!token) {
        this.log.warn('Token is not present in request header');
        throw new Error(JSON.stringify({ type: SERVER_ERROR.TOKEN_NOT_PRESENT, message: 'Token is not present in request header' }));
      }
      const decodeToken = jwt.verify(token, env.tokenSecretKey);
      delete decodeToken.iat;
      delete decodeToken.exp;

      // Verify token data with request body to authenticate
      if (isequal(decodeToken, req.body)) {
        next();
      } else {
        throw new Error(JSON.stringify({ type: SERVER_ERROR.INVALID_TOKEN, message: 'Provided token is invalid' }));
      }
    } catch (error) {
      if (error.message === 'jwt expired') {
        throw new Error(JSON.stringify({ type: SERVER_ERROR.INVALID_TOKEN, message: error.message }));
      } else {
        throw new Error(error.message);
      }
    }
  }
}
