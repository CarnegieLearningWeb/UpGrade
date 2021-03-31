import * as express from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import { LoggerInterface, Logger } from '../../decorators/Logger';
import { SettingService } from '../services/SettingService';
import { SERVER_ERROR } from 'upgrade_types';
import * as jwt from 'jsonwebtoken';
import * as config from '../../config.json';
import isequal from 'lodash.isequal';

export class ClientLibMiddleware implements ExpressMiddlewareInterface {
  constructor(@Logger(__filename) private log: LoggerInterface, public settingService: SettingService) {}

  public async use(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
    try {
      const authorization = req.header('authorization');
      const token = authorization && authorization.replace('Bearer ', '').trim();
      const setting = await this.settingService.getClientCheck();
      //   const data = {
      //     APIKey: '494ae733-53cb-4c64-a24e-dab23d55eeb4',
      //   };
      //   console.log('Start signing');
      //   const tokenSigned = jwt.sign(data, 'carnegilearning');
      //   console.log('tokenSigned', tokenSigned);

      if (setting.toCheckAuth) {
        // throw error if no token
        if (!token) {
          this.log.warn('Token is not present in request header');
          throw new Error(
            JSON.stringify({
              type: SERVER_ERROR.TOKEN_NOT_PRESENT,
              message: 'Token is not present in request header from client',
            })
          );
        }
        const decodeToken = jwt.verify(token, config.clientApi.secret);
        delete decodeToken.iat;
        delete decodeToken.exp;
        const APIKey = config.clientApi.data;

        if (isequal(decodeToken, APIKey)) {
          next();
        } else {
          throw new Error(JSON.stringify({ type: SERVER_ERROR.INVALID_TOKEN, message: 'Provided token is invalid' }));
        }
      } else {
        next();
      }
    } catch (error) {
      if (error.message === 'jwt expired') {
        throw new Error(JSON.stringify({ type: SERVER_ERROR.INVALID_TOKEN, message: error.message }));
      } else {
        throw new Error(JSON.stringify({ type: SERVER_ERROR.INVALID_TOKEN, message: 'Provided token is invalid' }));
      }
    }
  }
}
