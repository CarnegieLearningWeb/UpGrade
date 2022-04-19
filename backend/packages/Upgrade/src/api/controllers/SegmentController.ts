import { JsonController, Get, Delete, Param, Authorized, Post, Req, Body } from 'routing-controllers';
import { SegmentService } from '../services/SegmentService';
import { Segment } from '../models/Segment';
import { SERVER_ERROR } from 'upgrade_types';
import { Validator } from 'class-validator';
import { AppRequest } from '../../types';
const validator  = new Validator();


/**
 * @swagger
 * definitions:
 *   segmentResponse:
 *     type: array
 *     description: ''
 *     minItems: 1
 *     uniqueItems: true
 *     items:
 *       type: object
 *       required:
 *         - createdAt
 *         - updatedAt
 *         - versionNumber
 *         - id
 *         - name
 *         - description
 *         - context
 *       properties:
 *         createdAt:
 *           type: string
 *           minLength: 1
 *         updatedAt:
 *           type: string
 *           minLength: 1
 *         versionNumber:
 *           type: number
 *         id:
 *           type: string
 *           minLength: 1
 *         name:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *           minLength: 1
 *         context:
 *           type: string
 *           minLength: 1
 *   groupExplicitExperimentExcludeResponse:
 *     type: array
 *     description: ''
 *     minItems: 1
 *     uniqueItems: true
 *     items:
 *       type: object
 *       required:
 *         - createdAt
 *         - updatedAt
 *         - versionNumber
 *         - type
 *         - id
 *         - experimentId
 *       properties:
 *         createdAt:
 *           type: string
 *           minLength: 1
 *         updatedAt:
 *           type: string
 *           minLength: 1
 *         versionNumber:
 *           type: number
 *         type:
 *           type: string
 *           minLength: 1
 *         id:
 *           type: string
 *           minLength: 1
 *         experimentId:
 *           type: string
 *           minLength: 1
 */

/**
 * @swagger
 * tags:
 *   - name: Segment
 *     description: CRUD operations related to Segment
 */
@Authorized()
@JsonController('/segments')
export class SegmentController {
  constructor(public segment: SegmentService) {}

  /**
   * @swagger
   * /segments:
   *    get:
   *       description: Get all segments
   *       tags:
   *         - Segment
   *       produces:
   *         - application/json
   *       responses:
   *          '200':
   *            description: Get all segments
   *            schema:
   *              $ref: '#/definitions/segmentResponse'
   *          '401':
   *            description: Authorization Required Error
   */
  @Get()
  public getAllSegments( @Req() request: AppRequest ): Promise<Segment[]> {
    return this.segment.getAllSegments(request.logger);
  }

  /**
   * @swagger
   * /segments/{segmentId}:
   *    get:
   *      description: Get segment by id
   *      tags:
   *        - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: segmentId
   *          description: Segment id
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Get segment by id
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '404':
   *          description: Segment not found
   *        '500':
   *          description: Internal Server Error, SegmentId is not valid
  */
  @Get('/:segmentId')
  public getSegmentById( @Param('segmentId') segmentId: string, @Req() request: AppRequest ): Promise<Segment> {
    if (!segmentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : segmentId should not be null.'));
    }
    if (!validator.isUUID(segmentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : segmentId should be of type UUID.' })
        )
      );
    }
    return this.segment.getSegmentById(segmentId, request.logger);
  }

  /**
   * @swagger
   * /segments:
   *    post:
   *      description: Create a new segment
   *      tags:
   *        - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: body
   *          name: segment
   *          description: Segment object
   *          required: true
   *          schema:
   *            type: object
   *            required:
   *              - id
   *              - name
   *              - description
   *              - context
   *            properties:
   *              id:
   *                type: string
   *              name:
   *                type: string
   *              description:
   *                type: string
   *              context:
   *                type: string
   *            description: Segment object
   *      responses:
   *        '200':
   *          description: Create a new segment
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, Insert Error in database, SegmentId is not valid, JSON format is not valid
*/
  @Post()
  public insertSegment(
    @Body({ validate: { validationError: { target: false, value: false } } }) segment: Segment,
    @Req() request: AppRequest ): Promise<Segment> {
    return this.segment.upsertSegment(segment, request.logger);
  }

  /**
   * @swagger
   * /segments/update:
   *    post:
   *      description: Create a new segment
   *      tags:
   *        - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: body
   *          name: segment
   *          description: Segment object
   *          required: true
   *          schema:
   *            type: object
   *            required:
   *              - id
   *              - name
   *              - description
   *              - context
   *            properties:
   *              id:
   *                type: string
   *              name:
   *                type: string
   *              description:
   *                type: string
   *              context:
   *                type: string
   *            description: Segment object
   *      responses:
   *        '200':
   *          description: Create a new segment
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, Insert Error in database, SegmentId is not valid, JSON format is not valid
*/
@Post('/update')
public updateSegment(
  @Body({ validate: { validationError: { target: false, value: false } } }) segment: Segment,
  @Req() request: AppRequest ): Promise<Segment> {
  return this.segment.upsertSegment(segment, request.logger);
}

  /**
   * @swagger
   * /segments/{segmentId}:
   *    delete:
   *      description: Delete a segment
   *      tags:
   *      - Segment
   *      produces:
   *        - application/json
   *      parameters:
   *        - in: path
   *          name: segmentId
   *          description: Segment id
   *          required: true
   *          schema:
   *            type: string
   *      responses:
   *        '200':
   *          description: Delete a segment
   *          schema:
   *            $ref: '#/definitions/segmentResponse'
   *        '401':
   *          description: Authorization Required Error
   *        '500':
   *          description: Internal Server Error, SegmentId is not valid
   */
  @Delete('/:segmentId')
  public deleteSegment( @Param('segmentId') segmentId: string, @Req() request: AppRequest ): Promise<Segment> {
    if (!segmentId) {
      return Promise.reject(new Error(SERVER_ERROR.MISSING_PARAMS + ' : segmentId should not be null.'));
    }
    if (!validator.isUUID(segmentId)) {
      return Promise.reject(
        new Error(
          JSON.stringify({ type: SERVER_ERROR.INCORRECT_PARAM_FORMAT, message: ' : segmentId should be of type UUID.' })
        )
      );
    }
    return this.segment.deleteSegment(segmentId, request.logger);
  }
}