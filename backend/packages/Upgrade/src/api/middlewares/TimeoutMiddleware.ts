import * as express from 'express';
import { ExpressMiddlewareInterface, Middleware } from 'routing-controllers';
import { Service } from 'typedi';
import { SERVER_ERROR } from 'upgrade_types';
import { AppRequest } from '../../types';
import { env } from '../../env';

@Middleware({ type: 'before' })
@Service()
export class TimeoutMiddleware implements ExpressMiddlewareInterface {
  private timeoutMs: number;

  constructor() {
    this.timeoutMs = env.app.requestTimeoutMs;
    if (this.timeoutMs < 100) {
      throw new Error('CLIENT_SDK_REQUEST_TIMEOUT_MS must be at least 100ms');
    }
  }

  public use(req: AppRequest, res: express.Response, next: express.NextFunction): void {
    const startTime = Date.now();
    let timeoutTriggered = false;

    const timeoutTimer = setTimeout(() => {
      timeoutTriggered = true;

      const elapsed = Date.now() - startTime;
      req.logger.error({
        message: 'Client SDK request timeout exceeded',
        endpoint: req.originalUrl,
        method: req.method,
        user_id: req.get('User-Id'),
        session_id: req.get('Session-Id'),
        timeout_ms: this.timeoutMs,
        elapsed_ms: elapsed,
        type: SERVER_ERROR.CLIENT_REQUEST_TIMEOUT,
      });

      if (!res.headersSent) {
        const error = new Error('Client SDK request timeout exceeded');
        (error as any).type = SERVER_ERROR.CLIENT_REQUEST_TIMEOUT;
        (error as any).httpCode = 504;
        next(error);
      }
    }, this.timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeoutTimer);
    });

    res.on('close', () => {
      clearTimeout(timeoutTimer);
    });

    if (!timeoutTriggered) {
      next();
    }
  }
}
