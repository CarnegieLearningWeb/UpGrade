import * as express from 'express';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';

import { User } from '../api/models/User';
import { UserRepository } from '../api/repositories/UserRepository';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../env';
import { SERVER_ERROR } from 'upgrade_types';

@Service()
export class AuthService {
  constructor(@InjectRepository() private userRepository: UserRepository) {}

  public parseBasicAuthFromRequest(req: express.Request): string {
    console.log('DEBUGG Inside parseBasicAuthFromRequest');
    req.logger.info({ message: 'Inside parseBasicAuthFromRequest' });

    const authorization = req.header('authorization');
    return authorization && authorization.replace('Bearer ', '').trim();
  }

  public async validateUser(token: string, request: express.Request): Promise<User> {
    console.log('DEBUGG token', token);
    console.log('DEBUGG request', request);
    console.log('DEBUGG env.google.clientId', env.google.clientId);

    const client = new OAuth2Client(env.google.clientId);
    request.logger.info({ message: 'Validating Token' });

    let payload;
    try {
      // First, try to verify the token as an ID token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: env.google.clientId, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        // [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
      });
      payload = ticket.getPayload();
      request.logger.info({ message: 'ID Token Validated' });
    } catch (error) {
      // If ID token verification fails, try to verify it as an access token
      try {
        await client.getTokenInfo(token);
        request.logger.info({ message: 'Access Token Validated' });
        // For service account access tokens, we'll return null
        // We might want to implement specific handling for service accounts here
        return null;
      } catch (error) {
        request.logger.error(error);
        throw error;
      }
    }

    // check if user exist in the user repo
    const email = payload.email;
    // session id in logger:
    let session_id = null;
    // if session id received from clientlib request header:
    if (request.header('Session-Id')) {
      session_id = request.header('Session-Id');
    }
    const domain = payload.hd;
    request.logger.info({ message: `session-id: ${session_id}` });
    request.logger.info({ message: `domain: ${domain}` });
    request.logger.info({ message: `env.google.domainName allowed: ${env.google.domainName}` });
    request.logger.info({ message: 'Validating domain name' });
    if (env.google.domainName && env.google.domainName !== '' && env.google.domainName !== domain) {
      const error: any = new Error(`User domain is not same as required ${env.google.domainName}`);
      error.type = SERVER_ERROR.USER_NOT_FOUND;
      request.logger.error(error);
      throw error;
    }
    request.logger.info({ message: 'Domain name validated' });

    if (this.isLoginUserRequestPath(request)) {
      // No need to fetch user document
      // This is the case when user is trying to login the portal.
      // User document doesn't exist if user is visiting the portal for the first time.
      return null;
    }
    // add local cache for validating user for each request
    const document = await this.userRepository.find({ email });
    request.logger.child({ client_session_id: session_id, user: document });
    request.logger.info({ message: 'User document fetched' });
    if (document.length === 0) {
      request.logger.info({ message: 'User not found in database' });
      const error: any = 'User not found in the database';
      error.type = SERVER_ERROR.USER_NOT_FOUND;
      request.logger.error(error);
      throw error;
    }
    return document[0];
  }

  private isLoginUserRequestPath(request: express.Request): boolean {
    const loginUserRequestPath = '/api/login/user';
    return request.path === loginUserRequestPath;
  }
}
