import { Request, Response, NextFunction } from 'express';
import { BadRequestError, ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { env } from '../../env';
import { UnprocessableEntityException } from '@nestjs/common';
import { validateMoocletPolicyParameters } from '../validators/MoocletPolicyParametersFactory';

@Middleware({ type: 'before' })
export class ValidateMoocletPolicyParametersMiddleware implements ExpressMiddlewareInterface {
  public async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const experiment = req.body;

    if (!env.mooclets.enabled && 'moocletPolicyParameters' in experiment) {
      throw new UnprocessableEntityException(
        'Failed to create Experiment: moocletPolicyParameters was provided but mooclets are not enabled on backend.'
      );
    }

    if (env.mooclets.enabled) {
      try {
        const policyParameters = await validateMoocletPolicyParameters(
          experiment.assignmentAlgorithm,
          experiment.moocletPolicyParameters
        );
        req.body.moocletPolicyParameters = policyParameters;
      } catch (error) {
        throw new BadRequestError(`Validation failed: ${error}`);
      }
    }

    next();
  }
}