import * as express from 'express';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import cors from 'cors';
import { env } from '../../env';

const ourCors = {
  origin: function (origin, callback) {
    // Allow requests with no origin (non-browser requests)
    if (origin === undefined) {
      callback(null, true);
      return;
    }
    // Ignore the protocol, subdomains, and port
    const strippedOrigin = origin.match(
      /^(?:https?:\/\/)?(?:[^.]+\.)*(([^.]+\.[^./:]+)|localhost)(?::(\d+))?(?:\/.*)?$/
    );
    if (strippedOrigin && env.app.corsWhitelist.indexOf(strippedOrigin[1]) !== -1) {
      callback(null, true);
      return;
    }
    callback(new Error(`Request from unauthorized origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  maxAge: 86400, // 24 hours in seconds
};

@Middleware({ type: 'before' })
export class CORSMiddleware implements ExpressMiddlewareInterface {
  public use(req: express.Request, res: express.Response, next: express.NextFunction): any {
    return cors(ourCors)(req, res, next);
  }
}
