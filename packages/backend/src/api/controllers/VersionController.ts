import { JsonController, Get, Authorized, Req } from 'routing-controllers';
import { env } from '../../env';
import { AppRequest } from '../../types';

/**
 * @swagger
 * tags:
 *   - name: Version
 *     description: Get version details
 */

@Authorized()
@JsonController('/version')
export class VersionController {
  /**
   * @swagger
   * /version:
   *    get:
   *       description: Get Server Version
   *       tags:
   *         - Version
   *       responses:
   *          '200':
   *            description: Get Server Version
   */
  @Get('/')
  public async getVersionNumber(@Req() request: AppRequest): Promise<string> {
    request.logger.info({ message: 'Request received for version' });
    return env.app.version;
  }
}
