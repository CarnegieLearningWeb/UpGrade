import { NextFunction, Response } from 'express';
import { TimeoutMiddleware } from '../../../src/api/middlewares/TimeoutMiddleware';
import { SERVER_ERROR } from 'upgrade_types';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { env } from '../../../src/env';

describe('TimeoutMiddleware tests', () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: NextFunction;
  let timeoutMiddleware: TimeoutMiddleware;
  let mockLogger: any;
  let originalTimeoutMs: number;

  beforeAll(() => {
    // Save original timeout value
    originalTimeoutMs = env.app.requestTimeoutMs;
    // Set test timeout value
    (env.app as any).requestTimeoutMs = 5000;
  });

  afterAll(() => {
    // Restore original timeout value
    (env.app as any).requestTimeoutMs = originalTimeoutMs;
  });

  beforeEach(() => {
    jest.useFakeTimers();

    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    };

    mockRequest = {
      logger: mockLogger,
      originalUrl: '/v6/assign',
      method: 'POST',
      get: jest.fn((header: string) => {
        if (header === 'User-Id') return 'test-user-123';
        if (header === 'Session-Id') return 'test-session-456';
        return undefined;
      }),
    };

    // Create response mock with event listeners
    const eventListeners: { [key: string]: Function[] } = {};
    mockResponse = {
      headersSent: false,
      on: jest.fn((event: string, callback: Function) => {
        if (!eventListeners[event]) {
          eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
      }),
      emit: (event: string) => {
        if (eventListeners[event]) {
          eventListeners[event].forEach((callback) => callback());
        }
      },
    };

    nextFunction = jest.fn();
    timeoutMiddleware = new TimeoutMiddleware();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('should allow request to complete before timeout', () => {
    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Simulate request completing before timeout
    jest.advanceTimersByTime(2000); // 2 seconds
    mockResponse.emit('finish');

    // Fast forward past the timeout to ensure it doesn't fire
    jest.advanceTimersByTime(5000);

    // Next should have been called to continue middleware chain
    expect(nextFunction).toHaveBeenCalledTimes(1);
    // Logger should not have logged an error
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  test('should trigger timeout and call next with error', () => {
    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Fast forward past the timeout
    jest.advanceTimersByTime(5001);

    // Next should be called with error
    expect(nextFunction).toHaveBeenCalledTimes(2); // Once initially, once with error
    const errorCall = (nextFunction as jest.Mock).mock.calls[1][0];
    expect(errorCall).toBeInstanceOf(Error);
    expect(errorCall.message).toBe('Client SDK request timeout exceeded');
    expect(errorCall.type).toBe(SERVER_ERROR.CLIENT_REQUEST_TIMEOUT);
    expect(errorCall.httpCode).toBe(504);
  });

  test('should log timeout with full context', () => {
    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Fast forward past the timeout
    jest.advanceTimersByTime(5001);

    // Logger should have been called with proper context
    expect(mockLogger.error).toHaveBeenCalledWith({
      message: 'Client SDK request timeout exceeded',
      endpoint: '/v6/assign',
      method: 'POST',
      user_id: 'test-user-123',
      session_id: 'test-session-456',
      timeout_ms: 5000,
      elapsed_ms: expect.any(Number),
      type: SERVER_ERROR.CLIENT_REQUEST_TIMEOUT,
    });
  });

  test('should cleanup timer on response finish', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Simulate response finishing
    mockResponse.emit('finish');

    // clearTimeout should have been called
    expect(clearTimeoutSpy).toHaveBeenCalled();

    // Fast forward past timeout to ensure it doesn't fire
    jest.advanceTimersByTime(10000);

    // No error should be logged
    expect(mockLogger.error).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  test('should cleanup timer on connection close', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Simulate connection closing
    mockResponse.emit('close');

    // clearTimeout should have been called
    expect(clearTimeoutSpy).toHaveBeenCalled();

    // Fast forward past timeout to ensure it doesn't fire
    jest.advanceTimersByTime(10000);

    // No error should be logged
    expect(mockLogger.error).not.toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  test('should not send error if headers already sent', () => {
    mockResponse.headersSent = true;

    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Fast forward past the timeout
    jest.advanceTimersByTime(5001);

    // Logger should still be called
    expect(mockLogger.error).toHaveBeenCalled();

    // But next should only be called once (initial call, not with error)
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect((nextFunction as jest.Mock).mock.calls[0][0]).toBeUndefined();
  });

  test('should handle missing user-id header gracefully', () => {
    mockRequest.get = jest.fn((header: string) => {
      if (header === 'Session-Id') return 'test-session-456';
      return undefined;
    });

    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Fast forward past the timeout
    jest.advanceTimersByTime(5001);

    // Should still log error with undefined user_id
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Client SDK request timeout exceeded',
        user_id: undefined,
        session_id: 'test-session-456',
      })
    );
  });

  test('should handle missing session-id header gracefully', () => {
    mockRequest.get = jest.fn((header: string) => {
      if (header === 'User-Id') return 'test-user-123';
      return undefined;
    });

    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Fast forward past the timeout
    jest.advanceTimersByTime(5001);

    // Should still log error with undefined session_id
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Client SDK request timeout exceeded',
        user_id: 'test-user-123',
        session_id: undefined,
      })
    );
  });

  test('should throw error if timeout is less than 100ms', () => {
    (env.app as any).requestTimeoutMs = 50;

    expect(() => {
      new TimeoutMiddleware();
    }).toThrow('CLIENT_SDK_REQUEST_TIMEOUT_MS must be at least 100ms');

    // Restore for other tests
    (env.app as any).requestTimeoutMs = 5000;
  });

  test('should record accurate elapsed time', () => {
    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Fast forward exactly to timeout
    jest.advanceTimersByTime(5000);

    // Check that elapsed time is approximately correct (within 10ms tolerance)
    const logCall = mockLogger.error.mock.calls[0][0];
    expect(logCall.elapsed_ms).toBeGreaterThanOrEqual(4990);
    expect(logCall.elapsed_ms).toBeLessThanOrEqual(5100);
  });

  test('should work with v5 endpoints', () => {
    mockRequest.originalUrl = '/v5/init';
    mockRequest.method = 'POST';

    timeoutMiddleware.use(mockRequest, mockResponse as Response, nextFunction);

    // Fast forward past the timeout
    jest.advanceTimersByTime(5001);

    // Should log error with v5 endpoint
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/v5/init',
        message: 'Client SDK request timeout exceeded',
      })
    );
  });
});
