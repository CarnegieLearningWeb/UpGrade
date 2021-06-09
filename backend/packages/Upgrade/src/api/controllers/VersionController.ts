import { JsonController, Get, Authorized } from 'routing-controllers';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { env } from '../../env';

/**
 * @swagger
 * tags:
 *   - name: Version
 *     description: Get version details
 */

@Authorized()
@JsonController('/version')
export class VersionController {
    constructor(@Logger(__filename) private log: LoggerInterface) { }

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
    public async getVersionNumber(): Promise<string> {
        this.log.info('Request recieved for version');
        return env.app.version;
    }
}
