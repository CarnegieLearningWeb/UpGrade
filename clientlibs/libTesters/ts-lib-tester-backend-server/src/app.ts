import express, { Express, Request, Response } from 'express';
import { HookRequestBody } from '../../shared/models.js';
import { getUpgradeClientConstructor, validateHook } from './utils.js';
import routeHookToMockApp from './routeHookToMockApp.js';
import cors from 'cors';
import { GeneralTSBackendVersion5 } from './mockBackendTSServerApps/GeneralTSBackendVersion5.js';
// import dotenv from 'dotenv';

// dotenv.config();

const app: Express = express();
// const port = process.env.PORT;
const port = 3000;
app.use(cors());
app.use(express.json());

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

app.get('/api', (req: Request, res: Response) => {
  res.send('Serving TS Client Test Backend');
});

app.get('/api/mock-app-models', (req: Request, res: Response) => {
  // get the models from the mock apps themselves
  const models = [new GeneralTSBackendVersion5().getAppInterfaceModel()];

  res.json({ models });
});

app.post('/api/hook', async (req: Request, res: Response) => {
  // if all is valid
  if (!req.body && !validateHook(req.body) === false) {
    res.json({
      hookRecieved: req.body,
      response: {
        error: 'Invalid hook request',
      },
    });
    return;
  }

  // then use libversion create a client constructor

  const hookRequest: HookRequestBody = req.body;

  try {
    const ClientLibConstructor = getUpgradeClientConstructor(hookRequest.libVersion);

    console.log('ClientLibConstructor', ClientLibConstructor);

    // route to mock app with the client constructor, payload, and hook
    console.log('hookRequest', hookRequest);

    const response = await routeHookToMockApp(ClientLibConstructor, hookRequest);

    console.log('response', response);

    res.json(response);
  } catch (_) {
    res.json({
      hookRecieved: req.body,
      response: {
        error: `Invalid client library version for backend: ${hookRequest.libVersion}`,
      },
    });
    return;
  }
});
