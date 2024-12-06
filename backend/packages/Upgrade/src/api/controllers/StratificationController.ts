import { JsonController, Get, Delete, Authorized, Req, Res, Body, Post, Params } from 'routing-controllers';
import { AppRequest } from '../../types';
import { UserStratificationFactor } from '../models/UserStratificationFactor';
import { StratificationService } from '../services/StratificationService';
import {
  FactorStrata,
  StratificationFactorValidator,
  UploadedFilesArrayValidator,
} from './validators/StratificationValidator';
import { StratificationFactor } from '../models/StratificationFactor';
import { Response } from 'express';
/**
 * @swagger
 * definitions:
 *   FactorStrata:
 *     description: ''
 *     type: object
 *     required:
 *       - factor
 *       - value
 *     properties:
 *       factor:
 *         type: string
 *       value:
 *         type: object
 *   UserStratificationFactor:
 *     description: ''
 *     type: object
 *     properties:
 *       user:
 *         type: object
 *         required:
 *           - id
 *         properties:
 *           id:
 *             type: string
 *           group:
 *             type: object
 *           workingGroup:
 *             type: object
 *       stratificationFactor:
 *         type: object
 *         required:
 *           - stratificationFactorName
 *         properties:
 *           stratificationFactorName:
 *             type: string
 *       stratificationFactorValue:
 *         type: string
 */

/**
 * @swagger
 * tags:
 *   - name: Stratification
 *     description: CRUD operations related to Stratification
 */
@Authorized()
@JsonController('/stratification')
export class StratificationController {
  constructor(public stratificationService: StratificationService) {}

  /**
   * @swagger
   * /stratification:
   *    get:
   *       description: Get all stratification
   *       tags:
   *         - Stratification
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get all stratification
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/definitions/FactorStrata'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get()
  public async getAllStratification(@Req() request: AppRequest): Promise<FactorStrata[]> {
    return this.stratificationService.getAllStratification(request.logger);
  }

  /**
   * @swagger
   * /stratification/download/{factor}:
   *    get:
   *      description: Get stratificationFactor CSV by factorName
   *      tags:
   *        - Stratification
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: factor
   *          description: Factor name
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Get stratificationFactor detailed CSV by name
   *        '401':
   *          description: Authorization Required Error
   *        '404':
   *          description: Stratification Factor name not found
   *        '500':
   *          description: Internal Server Error, FactorName is not valid
   */
  @Get('/download/:factor')
  public async getStratificationByFactor(
    @Params({ validate: true }) { factor }: StratificationFactorValidator,
    @Req() request: AppRequest,
    @Res() response: Response
  ): Promise<Response> {
    try {
      const stratificationData = await this.stratificationService.getCSVDataByFactor(factor, request.logger);
      // return csv file with appropriate headers to request;
      response.setHeader('Content-Type', 'text/csv; charset=UTF-8');
      response.setHeader('Content-Disposition', `attachment; filename=data-${factor}.csv`);
      return response.send(stratificationData);
    } catch (error) {
      response.status(500).send({ error: 'Failed to generate CSV' });
      return response;
    }
  }

  /**
   * @swagger
   * /stratification:
   *    post:
   *      description: Create a new stratificationFactor by CSV
   *      tags:
   *        - Stratification
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: body
   *          name: file
   *          description: CSV file
   *          required: true
   *          schema:
   *            type: file
   *      responses:
   *        '200':
   *          description: Create a new UserStratificationFactors by CSV
   *          schema:
   *            type: array
   *            items:
   *              $ref: '#/definitions/UserStratificationFactor'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, Insert Error in database, CSV file is not valid
   */
  @Post()
  public async insertStratification(
    @Req() request: AppRequest,
    @Body({ validate: true }) body: UploadedFilesArrayValidator
  ): Promise<UserStratificationFactor[][]> {
    return this.stratificationService.insertStratificationFiles(body.files, request.logger);
  }

  /**
   * @swagger
   * /stratification/{factor}:
   *    delete:
   *      description: Delete a stratificationFactor by factorName
   *      tags:
   *      - Stratification
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: factor
   *          description: Factor name
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Delete a stratificationFactor by factorName
   *          schema:
   *            $ref: '#/definitions/FactorStrata'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, FactorName is not valid
   */
  @Delete('/:factor')
  public deleteStratification(
    @Params({ validate: true }) { factor }: StratificationFactorValidator,
    @Req() request: AppRequest
  ): Promise<StratificationFactor> {
    return this.stratificationService.deleteStratification(factor, request.logger);
  }
}
