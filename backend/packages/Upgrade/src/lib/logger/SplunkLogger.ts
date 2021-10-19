import * as path from 'path';
import * as winston from 'winston';
import SplunkStreamEvent from 'winston-splunk-httplogger';
// import { Logger } from './Logger';

// const splunkLogger = require('splunk-logging').Logger;

// var config = {
//     token: "0eb04d30-5e39-4832-a7fa-ff353adc8794",
//     url: "https://prd-p-er3fp.splunkcloud.com:8088"
//   };

// // Create a new logger
// var Logger = new splunkLogger(config);

export class SplunkLogger {

    public static DEFAULT_SCOPE = 'app';

    public static eventFormatter = (message, severity) => {
        delete message['msg'];
        if (message.meta[0]) {
            console.log(message.meta[0])
            if (message.meta[0].level == '') {
            message.meta[0].level = severity;
            }
            if (message.meta[0].message == '') {
            message.meta[0].message = message.meta['message'];
            }
            var event = message.meta[0];
        } else {
            var event = message.meta;
        }
        return event;
    };

    public static splunkSettings = {
        host : 'prd-p-er3fp.splunkcloud.com',
        token : '0eb04d30-5e39-4832-a7fa-ff353adc8794',
        index : 'ppl_upgrade',
        eventFormatter: SplunkLogger.eventFormatter,
    };

    public static payload_json = {
        message:"",
        level: "",
        http_request_id: "",
        client_session_id: "",
        endpoint: "",
        api_request_type: "",
        filepath: "",
        function_name: "",
        category: "",
      };

      
    /*
    * EXPRESS TYPESCRIPT BOILERPLATE
    * ----------------------------------------
    */

    // const log = new Logger(__filename);
    private static parsePathToScope(filepath: string): string {
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

    public scope: string;
    public logger = winston.createLogger({
        transports: [
          new winston.transports.Console(),
          new SplunkStreamEvent({ splunk: SplunkLogger.splunkSettings})
        ]
      });
      
    constructor(scope?: string) {
        this.scope = SplunkLogger.parsePathToScope((scope) ? scope : SplunkLogger.DEFAULT_SCOPE);
    }
    
    public debug(message: string, ...args: any[]): void {
        this.log('debug', message, args);
    }

    public info(message: string, ...args: any[]): void {
        this.log('info', message, args);
    }

    public warn(message: string, ...args: any[]): void {
        this.log('warn', message, args);
    }

    public error(message: string, ...args: any[]): void {
        this.log('error', message, args);
    }

    private log(level: string, message: string, args: any[]): void {
        if (winston) {
            winston[level](`${this.formatScope()} ${message}`, args);
        }
    }

    private formatScope(): string {
        return `[${this.scope}]`;
    }

    // return logger;
}
