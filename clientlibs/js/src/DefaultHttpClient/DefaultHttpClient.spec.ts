import axios from 'axios';
import { DefaultHttpClient } from './DefaultHttpClient';

jest.mock('axios');
const mockAxios = axios as unknown as jest.Mock;

const httpError = (status?: number) =>
  Object.assign(new Error('request failed'), status ? { response: { status } } : {});

describe('DefaultHttpClient', () => {
  let client: DefaultHttpClient;
  const url = 'http://localhost:3030/api/v6/assign';
  const options = () => ({ headers: { 'Content-Type': 'application/json' } });

  beforeEach(() => {
    mockAxios.mockReset();
    client = new DefaultHttpClient();
    jest.spyOn(client as any, 'wait').mockResolvedValue(undefined);
  });

  it('returns response data on success with a default timeout and request body', async () => {
    mockAxios.mockResolvedValue({ status: 200, data: ['flag'] });

    await expect(client.doPost(url, { context: 'app' }, options())).resolves.toEqual(['flag']);
    expect(mockAxios).toHaveBeenCalledWith(
      expect.objectContaining({ url, method: 'POST', data: { context: 'app' }, timeout: 5000 })
    );
  });

  it('retries 5xx responses and succeeds once the server recovers', async () => {
    mockAxios.mockRejectedValueOnce(httpError(503)).mockResolvedValueOnce({ status: 200, data: 'ok' });

    await expect(client.doGet(url, options())).resolves.toEqual('ok');
    expect(mockAxios).toHaveBeenCalledTimes(2);
  });

  it('retries network failures (no response)', async () => {
    mockAxios.mockRejectedValueOnce(httpError()).mockResolvedValueOnce({ status: 200, data: 'ok' });

    await expect(client.doPatch(url, {}, options())).resolves.toEqual('ok');
    expect(mockAxios).toHaveBeenCalledTimes(2);
  });

  it('does not retry 4xx responses', async () => {
    mockAxios.mockRejectedValue(httpError(400));

    await expect(client.doPost(url, {}, options())).rejects.toThrow();
    expect(mockAxios).toHaveBeenCalledTimes(1);
  });

  it('gives up after 3 retries with doubling backoff', async () => {
    mockAxios.mockRejectedValue(httpError(500));

    await expect(client.doPost(url, {}, options())).rejects.toThrow();
    expect(mockAxios).toHaveBeenCalledTimes(4);
    expect((client as any).wait.mock.calls).toEqual([[300], [600], [1200]]);
  });
});
