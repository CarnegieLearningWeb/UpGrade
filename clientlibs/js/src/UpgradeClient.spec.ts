import UpgradeClient from './UpgradeClient';

describe('UpgradeClient', () => {
  it('should create client', () => {
    const client = new UpgradeClient('testUser123', 'http://localhost:3030');

    expect(client).toBeTruthy();
  });
});
