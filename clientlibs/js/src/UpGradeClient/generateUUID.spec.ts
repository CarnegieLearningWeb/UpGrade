import UpgradeClient from './UpgradeClient';

const mockHttpClient = {
  doGet: jest.fn(),
  doPost: jest.fn(),
  doPatch: jest.fn(),
};

describe('generateUUID (via constructor clientSessionId)', () => {
  const originalCrypto = global.crypto;

  afterEach(() => {
    Object.defineProperty(global, 'crypto', { value: originalCrypto, writable: true, configurable: true });
  });

  it('should throw TypeError when crypto.randomUUID is unavailable (HTTP context)', () => {
    Object.defineProperty(global, 'crypto', {
      value: { getRandomValues: jest.fn() },
      writable: true,
      configurable: true,
    });
    expect(() => new UpgradeClient('u1', 'http://host', 'ctx', { httpClient: mockHttpClient })).toThrow(TypeError);
  });

  it('should throw TypeError when crypto is present but empty', () => {
    Object.defineProperty(global, 'crypto', {
      value: {},
      writable: true,
      configurable: true,
    });
    expect(() => new UpgradeClient('u2', 'http://host', 'ctx', { httpClient: mockHttpClient })).toThrow(TypeError);
  });

  it('should throw TypeError when crypto is undefined', () => {
    Object.defineProperty(global, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(() => new UpgradeClient('u3', 'http://host', 'ctx', { httpClient: mockHttpClient })).toThrow(TypeError);
  });

  it('should use provided clientSessionId instead of generating one', () => {
    const providedId = 'my-custom-session-id';
    const client = new UpgradeClient('u4', 'http://host', 'ctx', {
      httpClient: mockHttpClient,
      clientSessionId: providedId,
    });
    const sessionId = (client as any).apiService['clientSessionId'];
    expect(sessionId).toBe(providedId);
  });
});
