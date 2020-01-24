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
export declare enum FunctionsErrorCode {
    ok = "ok",
    cancelled = "cancelled",
    unknown = "unknown",
    invalid_argument = "invalid_argument",
    deadline_exceeded = "deadline_exceeded",
    not_found = "not_found",
    already_exists = "already_exists",
    permission_denied = "permission_denied",
    resource_exhausted = "resource_exhausted",
    failed_precondition = "failed_precondition",
    aborted = "aborted",
    out_of_range = "out_of_range",
    unimplemented = "unimplemented",
    internal = "internal",
    unavailable = "unavailable",
    data_loss = "data_loss",
    unauthenticated = "unauthenticated",
    email_already_exists = "auth/email-already-exists"
}
/**
 * An explicit error that can be thrown from a handler to send an error to the
 * client that called the function.
 */
export declare class HttpsError extends Error {
    /**
     * A standard error code that will be returned to the client. This also
     * determines the HTTP status code of the response, as defined in code.proto.
     */
    readonly code: FunctionsErrorCode;
    /**
     * Extra data to be converted to JSON and included in the error response.
     */
    readonly details?: any;
    constructor(code: FunctionsErrorCode, message?: string, details?: any);
    /**
     * @internal
     * A string representation of the Google error code for this error for HTTP.
     */
    get status(): any;
    /**
     * @internal
     * Returns the canonical http status code for the given error.
     */
    get httpStatus(): 200 | 499 | 500 | 400 | 504 | 404 | 409 | 403 | 401 | 429 | 501 | 503;
    toJSON(): any;
}
