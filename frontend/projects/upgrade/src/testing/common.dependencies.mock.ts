/**
 * TODO make this smarter
 * 
 * For common mocked service dependencies in unit tests
 * General global use only with basic jest spies!
 * Specific return values will need set in local test files.
 */

import { of } from "rxjs/internal/observable/of";

export class MockStateStore {
    dispatch = jest.fn();
    pipe = jest.fn().mockReturnValue(of());
}

export class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
}

