import { JsonController, Post, Body, Get, Authorized, Req } from 'routing-controllers';
import { SettingService } from '../services/SettingService';
import { Setting } from '../models/Setting';
import { SettingParamsValidator } from './validators/SettingParamsValidator';
import { AppRequest } from '../../types';

/**
 * @swagger
 * tags:
 *   - name: Setting
 *     description: Setting Endpoint
 */

@Authorized()
@JsonController('/setting')
export class SettingController {
  constructor(public settingService: SettingService) {}

  /**
   * @swagger
   * /setting:
   *    get:
   *       description: Get project setting
   *       produces:
   *         - application/json
   *       tags:
   *         - Setting
   *       responses:
   *          '200':
   *            description: Project settings
   */
  @Get()
  public getSetting(@Req() request: AppRequest): Promise<Setting> {
    return this.settingService.getClientCheck(request.logger);
  }

  /**
   * @swagger
   * /setting:
   *    post:
   *       description: Update project settings
   *       consumes:
   *         - application/json
   *       parameters:
   *         - in: body
   *           name: params
   *           required: true
   *           schema:
   *             type: object
   *             properties:
   *                toCheckAuth:
   *                    type: boolean
   *                toFilterMetric:
   *                    type: boolean
   *           description: Set settings
   *       tags:
   *         - Setting
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Create/Update settings
   */
  @Post()
  public upsertSetting(
    @Body({ validate: true })
    settingParams: SettingParamsValidator,
    @Req() request: AppRequest
  ): Promise<Setting> {
    return this.settingService.setClientCheck(settingParams.toCheckAuth, settingParams.toFilterMetric, request.logger);
  }
}
