import UpgradeClient from './UpgradeClient';

describe('UpgradeClient quick local tests', () => {
  let client: UpgradeClient;
  const hostUrl = 'http://localhost:3030';
  const token = 'someToken';

  it('should create client', () => {
    const userId = 'testUserCreate';
    client = new UpgradeClient(userId, hostUrl, { token });
    expect(client).toBeTruthy();
  });

  describe('init', () => {
    it('should successfully init user with no group or workingGroup', async () => {
      const userId = 'testUserInit1';
      const expectedResponse = { id: userId, group: null, workingGroup: null };

      client = new UpgradeClient(userId, hostUrl, { token });
      const response = await client.init();

      expect(response).toEqual(expectedResponse);
    });

    it('should successfully init user with valid group', async () => {
      const userId = 'testUserInit4';
      const group = {
        schoolId: ['washington'],
        classId: ['qwerty', 'yuiop'],
      };
      console.log(group);

      client = new UpgradeClient(userId, hostUrl, { token });
      const expectedResponse = { id: userId, group, workingGroup: null };

      const response = await client.init(group);

      console.log(response);

      expect(response).toEqual(expectedResponse);
    });
  });
});
