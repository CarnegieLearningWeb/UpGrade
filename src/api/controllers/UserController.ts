import { JsonController, Get, OnUndefined, Param, Post, Put, Body } from 'routing-controllers';
import { UserService } from '../services/UserService';
import { User } from '../models/User';
import { UserNotFoundError } from '../errors/UserNotFoundError';

@JsonController('/users')
export class UserController {
  constructor(public userService: UserService) {}

  /**
   * @swagger
   * /users:
   *    get:
   *       description: Get all the users
   *       responses:
   *          '200':
   *            description: Successful
   */
  @Get()
  public find(): Promise<User[]> {
    return this.userService.find();
  }

  @Get('/:id')
  @OnUndefined(UserNotFoundError)
  public one(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Post()
  public create(@Body() users: User[]): Promise<User[]> {
    return this.userService.create(users);
  }

  @Put('/:id')
  public update(@Param('id') id: string, @Body() user: User): Promise<User> {
    return this.userService.update(id, user);
  }
}
