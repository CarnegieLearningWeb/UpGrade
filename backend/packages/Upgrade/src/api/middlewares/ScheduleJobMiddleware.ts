import { ErrorWithType } from './../errors/ErrorWithType';
import * as express from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import * as jwt from 'jsonwebtoken';
import isequal from 'lodash.isequal';
import { env } from '../../env';
import { SERVER_ERROR } from 'upgrade_types';

export class ScheduleJobMiddleware implements ExpressMiddlewareInterface {
  public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
    try {
      const authorization = req.header('authorization');
      const token = authorization && authorization.replace('Bearer ', '').trim();
      if (!token) {
        req.logger.warn({ message: 'Token is not present in request header' });
        const error = new Error('Token is not present in request header');
        (error as any).type = SERVER_ERROR.TOKEN_NOT_PRESENT;
        throw error;
      }
      const decodeToken = jwt.verify(token, env.tokenSecretKey) as jwt.JwtPayload;
      delete decodeToken.iat;
      delete decodeToken.exp;

      // Verify token data with request body to authenticate
      if (isequal(decodeToken, req.body)) {
        next();
      } else {
        const error = new Error('Provided token is invalid');
        (error as any).type = SERVER_ERROR.INVALID_TOKEN;
        req.logger.error(error);
        throw error;
      }
    } catch (err) {
      const error = err as ErrorWithType;
      if (error.message === 'jwt expired') {
        error.type = SERVER_ERROR.INVALID_TOKEN;
        req.logger.error(error);
        throw error;
      } else {
        throw new Error(error.message);
      }
    }
  }
}
