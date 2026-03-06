import { UpgradeLogger } from './src/lib/logger/UpgradeLogger';

declare global {
  namespace Express {
    export interface Request {
      // Override the Express.Request type to add a logger property
      logger: UpgradeLogger;
    }
  }
}
