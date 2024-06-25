import * as express from 'express';
import { SettingService } from '../services/SettingService';
import { SERVER_ERROR } from 'upgrade_types';
import { AppRequest } from '../../types';
import { Service } from 'typedi';
import { ExperimentUserService } from '../services/ExperimentUserService';

@Service()
export class UserCheckMiddleware {
  constructor(public settingService: SettingService, public experimentUserService: ExperimentUserService) {}

  public async use(req: AppRequest, res: AppRequest, next: express.NextFunction): Promise<any> {
    try {
      const user_id = req.get('User-Id');
      req.logger.child({ user_id });
      req.logger.debug({ message: 'User Id is:', user_id });
      console.log(user_id);
      if (req.url !== '/api/init') {
        const experimentUserDoc = await this.experimentUserService.getUserDoc(user_id, req.logger);

        if (!experimentUserDoc) {
          const error = new Error(`User not found: ${user_id}`);
          (error as any).type = SERVER_ERROR.EXPERIMENT_USER_NOT_DEFINED;
          (error as any).httpCode = 404;
          req.logger.error(error);
          return next(error);
        }
      }
      // Continue to the next middleware
      next();
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
}
