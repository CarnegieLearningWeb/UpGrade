/**
 * The set of Firebase Functions status codes. The codes are the same at the
 * ones exposed by gRPC here:
 * https://github.com/grpc/grpc/blob/master/doc/statuscodes.md
 *
 * Possible values:
 * - 'cancelled': The operation was cancelled (typically by the caller).
 * - 'unknown': Unknown error or an error from a different error domain.
 * - 'invalid-argument': Client specified an invalid argument. Note that this
 *   differs from 'failed-precondition'. 'invalid-argument' indicates
 *   arguments that are problematic regardless of the state of the system
 *   (e.g. an invalid field name).
 * - 'deadline-exceeded': Deadline expired before operation could complete.
 *   For operations that change the state of the system, this error may be
 *   returned even if the operation has completed successfully. For example,
 *   a successful response from a server could have been delayed long enough
 *   for the deadline to expire.
 * - 'not-found': Some requested document was not found.
 * - 'already-exists': Some document that we attempted to create already
 *   exists.
 * - 'permission-denied': The caller does not have permission to execute the
 *   specified operation.
 * - 'resource-exhausted': Some resource has been exhausted, perhaps a
 *   per-user quota, or perhaps the entire file system is out of space.
 * - 'failed-precondition': Operation was rejected because the system is not
 *   in a state required for the operation's execution.
 * - 'aborted': The operation was aborted, typically due to a concurrency
 *   issue like transaction aborts, etc.
 * - 'out-of-range': Operation was attempted past the valid range.
 * - 'unimplemented': Operation is not implemented or not supported/enabled.
 * - 'internal': Internal errors. Means some invariants expected by
 *   underlying system has been broken. If you see one of these errors,
 *   something is very broken.
 * - 'unavailable': The service is currently unavailable. This is most likely
 *   a transient condition and may be corrected by retrying with a backoff.
 * - 'data-loss': Unrecoverable data loss or corruption.
 * - 'unauthenticated': The request does not have valid authentication
 *   credentials for the operation.
 */
export enum FunctionsErrorCode {
    ok = 'ok',
    cancelled = 'cancelled',
    unknown = 'unknown',
    invalid_argument = 'invalid_argument',
    deadline_exceeded = 'deadline_exceeded',
    not_found = 'not_found',
    already_exists = 'already_exists',
    permission_denied = 'permission_denied',
    resource_exhausted = 'resource_exhausted',
    failed_precondition = 'failed_precondition',
    aborted = 'aborted',
    out_of_range = 'out_of_range',
    unimplemented = 'unimplemented',
    internal = 'internal',
    unavailable = 'unavailable',
    data_loss = 'data_loss',
    unauthenticated = 'unauthenticated',
    email_already_exists = 'auth/email-already-exists'
}

/**
 * An explicit error that can be thrown from a handler to send an error to the
 * client that called the function.
 */
export class HttpsError extends Error {
    /**
     * A standard error code that will be returned to the client. This also
     * determines the HTTP status code of the response, as defined in code.proto.
     */
    readonly code: FunctionsErrorCode;
    /**
     * Extra data to be converted to JSON and included in the error response.
     */
    readonly details?: any;
    constructor(code: FunctionsErrorCode, message?: string, details?: any) {
        super(message);
        // Object.setPrototypeOf(this, HttpsError.prototype);
        this.code = code;
        this.details = details;
    }

    /**
     * @internal
     * A string representation of the Google error code for this error for HTTP.
     */
    get status() {
        return FunctionsErrorCode[this.code];
    }
    /**
     * @internal
     * Returns the canonical http status code for the given error.
     */
    get httpStatus() {
        switch (this.code) {
            case FunctionsErrorCode.ok:
                return 200;
            case FunctionsErrorCode.cancelled:
                return 499;
            case FunctionsErrorCode.unknown:
                return 500;
            case FunctionsErrorCode.invalid_argument:
                return 400;
            case FunctionsErrorCode.deadline_exceeded:
                return 504;
            case FunctionsErrorCode.not_found:
                return 404;
            case FunctionsErrorCode.already_exists:
                return 409;
            case FunctionsErrorCode.email_already_exists:
                return 409;
            case FunctionsErrorCode.permission_denied:
                return 403;
            case FunctionsErrorCode.unauthenticated:
                return 401;
            case FunctionsErrorCode.resource_exhausted:
                return 429;
            case FunctionsErrorCode.failed_precondition:
                return 400;
            case FunctionsErrorCode.aborted:
                return 409;
            case FunctionsErrorCode.out_of_range:
                return 400;
            case FunctionsErrorCode.unimplemented:
                return 501;
            case FunctionsErrorCode.internal:
                return 500;
            case FunctionsErrorCode.unavailable:
                return 503;
            case FunctionsErrorCode.data_loss:
                return 500;
            // This should never happen as long as the type system is doing its job.
            default:
                throw new Error('Invalid error code: ' + this.code);
        }
    }

    toJSON() {
        const json: any = {
            status: this.status,
            message: this.message,
        };
        if (this.details) {
            json.details = this.details;
        }
        return json;
    }
}
