import * as express from 'express';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

import { User } from '../api/models/User';
import { UserRepository } from '../api/repositories/UserRepository';
import { Logger, LoggerInterface } from '../decorators/Logger';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';

@Service()
export class AuthService {
  constructor(
    @Logger(__filename) private log: LoggerInterface,
    @OrmRepository() private userRepository: UserRepository
  ) {}

  public parseBasicAuthFromRequest(req: express.Request): string {
    this.log.info('Inside parseBasicAuthFromRequest');

    const authorization = req.header('authorization');
    return authorization && authorization.replace('Bearer ', '').trim();
  }

  public async validateUser(token: string, request: express.Request): Promise<User> {
    const client = new OAuth2Client(env.google.clientId);
    this.log.info(`Validating ID Token`);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: env.google.clientId, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    this.log.info(`Token Validated`);

    const payload = ticket.getPayload();

    // check if user exist in the user repo
    const email = payload.email;
    const hd = payload.hd;

    this.log.info('hd', hd);
    this.log.info('env.google.domainName', env.google.domainName);
    this.log.info(`Validating domain name`);
    if (env.google.domainName && env.google.domainName !== '' && env.google.domainName !== hd) {
      const error: any = new Error(`User domain is not same as required ${env.google.domainName}`);
      error.type = SERVER_ERROR.USER_NOT_FOUND;
      throw error;
    }
    this.log.info(`Domain name validated`);

    if (this.isLoginUserRequestPath(request)) {
      // No need to fetch user document
      // This is the case when user is trying to login the portal.
      // User document doesn't exist if user is visiting the portal for the first time.
      return null;
    }
    // add local cache for validating user for each request
    const document = await this.userRepository.find({ email });
    if (document.length === 0) {
      this.log.info(`User not found in database`);
      const error: any = 'User not found in the database';
      error.type = SERVER_ERROR.USER_NOT_FOUND;
      throw error;
    }
    return document[0];
  }

  private isLoginUserRequestPath(request: express.Request): boolean {
    const loginUserRequestPath = '/api/login/user';
    return request.path === loginUserRequestPath;
  }
}
