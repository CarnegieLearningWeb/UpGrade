import { Get, JsonController, Res } from 'routing-controllers';
import { Response } from 'express';
import { GoogleAuth } from 'google-auth-library';
import { env } from '../../env';
import * as path from 'path';
import * as os from 'os';

@JsonController()
export class TestTokenController {
  @Get('/token')
  async getToken(@Res() response: Response) {
    if (!env.google.allowTestTokenService) {
      return response.status(403).json({ error: 'Token service is not allowed' });
    }

    try {
      // Resolve absolute path to credential.json file on server
      const keyFilename = path.join(os.homedir(), env.google.keyFilename.replace(/^~\//, ''));

      const auth = new GoogleAuth({
        keyFilename,
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
      });

      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      return response.json({ token: accessToken.token });
    } catch (error) {
      console.error('Error fetching token:', error);
      return response.status(500).json({ error: 'Failed to fetch token' });
    }
  }
}
