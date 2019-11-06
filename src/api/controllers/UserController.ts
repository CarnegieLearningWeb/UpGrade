import { JsonController, Get, OnUndefined, Param, Post, Put, Body } from 'routing-controllers';
import { UserService } from '../services/UserService';
import { User } from '../models/User';
import { UserNotFoundError } from '../errors/UserNotFoundError';

@JsonController('/users')
export class UserController {
  constructor(public userService: UserService) {}

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
  public create(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }

  @Put('/:id')
  public update(@Param('id') id: string, @Body() user: User): Promise<User> {
    return this.userService.update(id, user);
  }
}
