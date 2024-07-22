import { ErrorWithType } from './../errors/ErrorWithType';
import * as express from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import { SettingService } from '../services/SettingService';
import { SERVER_ERROR } from 'upgrade_types';
import * as jwt from 'jsonwebtoken';
import isequal from 'lodash.isequal';
import { env } from '../../env';
import { AppRequest } from '../../types';
import { Service } from 'typedi';

@Service()
export class ClientLibMiddleware implements ExpressMiddlewareInterface {
  constructor(public settingService: SettingService) {}

  public async use(req: AppRequest, res: AppRequest, next: express.NextFunction): Promise<any> {
    try {
      const authorization = req.header('authorization');
      const token = authorization && authorization.replace('Bearer ', '').trim();
      const setting = await this.settingService.getClientCheck(req.logger);
      // const data = {
      //   APIKey: 'key',
      // };
      // console.log('Start signing');
      // const tokenSigned = jwt.sign(data, 'secret');
      // console.log('tokenSigned', tokenSigned);
      // adding session id in logger instance:
      let session_id = null;
      // if session id received from clientlib request header:
      if (req.get('Session-Id')) {
        session_id = req.get('Session-Id');
      }
      req.logger.child({ client_session_id: session_id });
      req.logger.debug({ message: 'Session Id updated in logger instance' });
      if (setting.toCheckAuth) {
        // throw error if no token
        if (!token) {
          req.logger.warn({ message: 'Token is not present in request header' });
          const error = new Error('Token is not present in request header from client');
          (error as any).type = SERVER_ERROR.TOKEN_NOT_PRESENT;
          (error as any).httpCode = 401;
          throw error;
        }
        const { secret, key } = env.clientApi;
        let decodeToken: any;
        try {
          decodeToken = jwt.verify(token, secret);
        } catch (err) {
          const error = err as ErrorWithType;
          (error as any).type = SERVER_ERROR.TOKEN_VALIDATION_FAILED;
          (error as any).httpCode = 401;
          req.logger.error(error);
          throw error;
        }
        delete decodeToken.iat;
        delete decodeToken.exp;

        if (isequal(decodeToken, { APIKey: key })) {
          next();
        } else {
          const error = new Error('Provided token is invalid');
          (error as any).type = SERVER_ERROR.INVALID_TOKEN;
          (error as any).httpCode = 401;
          req.logger.error(error);
          throw error;
        }
      } else {
        next();
      }
    } catch (error) {
      const err = error as ErrorWithType;
      if (err.message === 'jwt expired' || err.message === 'invalid signature') {
        err.type = SERVER_ERROR.INVALID_TOKEN;
        (error as any).httpCode = 401;
        req.logger.error(err);
        throw err;
      } else {
        req.logger.error(err);
        throw err;
      }
    }
  }
}
