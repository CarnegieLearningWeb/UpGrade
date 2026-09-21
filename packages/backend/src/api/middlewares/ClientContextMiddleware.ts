import * as express from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { AppRequest } from '../../types';
import { addCustomAttribute, sanitizeCustomAttributeValue } from '../../lib/newrelic';

// Scoped (via @UseBefore) to the client-SDK controller only, so admin/UI traffic never
// carries this facet. Older clientlibs on v6 routes don't send these headers yet, so we
// still report 'unknown' there rather than dropping the field.
@Service()
export class ClientContextMiddleware implements ExpressMiddlewareInterface {
  public use(req: AppRequest, res: express.Response, next: express.NextFunction): void {
    const clientContext = sanitizeCustomAttributeValue(req.get('Client-Context'));
    const clientVersion = sanitizeCustomAttributeValue(req.get('Client-Version'));

    req.logger.child({ client_context: clientContext, client_version: clientVersion });

    // makes `clientContext`/`clientVersion` available as FACETs on New Relic transactions
    addCustomAttribute('clientContext', clientContext);
    addCustomAttribute('clientVersion', clientVersion);

    next();
  }
}
