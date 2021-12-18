import * as path from 'path';
import * as winston from 'winston';

export class UpgradeLogger {
  public static DEFAULT_SCOPE = 'app';
  public scope: string;
  public logger: winston.Logger;
  userDoc: any;

  constructor(scope?: string) {
    this.logger = winston.child({});
    this.scope = this.parsePathToScopeFileName(scope ? scope : UpgradeLogger.DEFAULT_SCOPE);
  }

  public parsePathToScopeFileName(filepath: string): string {
    if (filepath.indexOf(path.sep) >= 0) {
      filepath = filepath.replace(process.cwd(), '');
      filepath = filepath.replace(`${path.sep}src${path.sep}`, '');
      filepath = filepath.replace(`${path.sep}dist${path.sep}`, '');
      filepath = filepath.replace('.ts', '');
      filepath = filepath.replace('.js', '');
      filepath = filepath.replace(path.sep, ':');
    }
    return filepath;
  }

  public debug(message: Record<string, any>, ...args: any[]): void {
    this.log('debug', message, args);
  }

  public info(message: Record<string, any>, ...args: any[]): void {
    this.log('info', message, args);
  }
  public warn(message: Record<string, any>, ...args: any[]): void {
    this.log('warn', message, args);
  }

  public error(message: Record<string, any>, ...args: any[]): void {
    this.log('error', message, args);
  }

  public child(override: Record<string, any>): void {
    this.logger = this.logger.child(override);
  }

  public getLogger(): winston.Logger {
    return this.logger;
  }

  private log(level: string, message: any, args: any[]): void {
    if (this.logger) {
      this.logger[level](message, args);
    }
  }
}
