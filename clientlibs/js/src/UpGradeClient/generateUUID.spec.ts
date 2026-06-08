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

  it('should use crypto.randomUUID when available', () => {
    const fakeUUID = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee';
    Object.defineProperty(global, 'crypto', {
      value: { randomUUID: jest.fn(() => fakeUUID), getRandomValues: jest.fn() },
      writable: true,
      configurable: true,
    });

    const client = new UpgradeClient('u1', 'http://host', 'ctx', { httpClient: mockHttpClient });
    const sessionId = (client as any).apiService['clientSessionId'];

    expect(sessionId).toBe(fakeUUID);
    expect(crypto.randomUUID).toHaveBeenCalled();
  });

  it('should fall back to crypto.getRandomValues-based UUID when randomUUID is unavailable', () => {
    const mockGetRandomValues = jest.fn((arr: Uint8Array) => {
      arr.fill(0xab);
      return arr;
    });
    Object.defineProperty(global, 'crypto', {
      value: { getRandomValues: mockGetRandomValues },
      writable: true,
      configurable: true,
    });

    const client = new UpgradeClient('u2', 'http://host', 'ctx', { httpClient: mockHttpClient });
    const sessionId = (client as any).apiService['clientSessionId'];

    expect(mockGetRandomValues).toHaveBeenCalled();
    expect(sessionId).toBe('abababab-abab-4bab-abab-abababababab');
  });

  it('should fall back to Math.random-based UUID when crypto has neither randomUUID nor getRandomValues', () => {
    Object.defineProperty(global, 'crypto', {
      value: {},
      writable: true,
      configurable: true,
    });

    const client = new UpgradeClient('u3', 'http://host', 'ctx', { httpClient: mockHttpClient });
    const sessionId = (client as any).apiService['clientSessionId'];

    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should fall back to Math.random-based UUID when crypto is undefined', () => {
    Object.defineProperty(global, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const client = new UpgradeClient('u4', 'http://host', 'ctx', { httpClient: mockHttpClient });
    const sessionId = (client as any).apiService['clientSessionId'];

    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should use provided clientSessionId instead of generating one', () => {
    const providedId = 'my-custom-session-id';
    const client = new UpgradeClient('u5', 'http://host', 'ctx', {
      httpClient: mockHttpClient,
      clientSessionId: providedId,
    });
    const sessionId = (client as any).apiService['clientSessionId'];

    expect(sessionId).toBe(providedId);
  });
});

