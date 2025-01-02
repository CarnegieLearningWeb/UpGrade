import { Request, Response, NextFunction } from 'express';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { env } from '../../env';
import { UnprocessableEntityException } from '@nestjs/common';

@Middleware({ type: 'before' })
export class ValidateMoocletPolicyParametersMiddleware implements ExpressMiddlewareInterface {
  public async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const experiment = req.body;

    if (!env.mooclets?.enabled && 'moocletPolicyParameters' in experiment) {
      throw new UnprocessableEntityException(
        'Failed to create Experiment: moocletPolicyParameters was provided but mooclets are not enabled on backend.'
      );
    }

    // else, if mooclets is not enabled, keep calm and carry on
    next();
  }
}
