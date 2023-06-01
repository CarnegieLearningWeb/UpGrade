import express from 'express';
import { getUpgradeClientConstructor, validateHook } from './utils.js';
import routeHookToMockApp from './routeHookToMockApp.js';
// import dotenv from 'dotenv';
// dotenv.config();
const app = express();
// const port = process.env.PORT;
const port = 3000;
app.use(express.json());
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
app.get('/api', (req, res) => {
    res.send('Serving TS Client Test Backend');
});
app.post('/api/hook', (req, res) => {
    // if all is valid
    if (!req.body && !validateHook(req.body) === false) {
        res.send('Invalid hook request');
        return;
    }
    // then use libversion create a client constructor
    const hookRequest = req.body;
    const ClientLibConstructor = getUpgradeClientConstructor(hookRequest.libVersion);
    // route to mock app with the client constructor, payload, and hook
    console.log('hookRequest', hookRequest);
    const response = routeHookToMockApp(ClientLibConstructor, hookRequest);
    console.log('response', response);
    // res.send('I got a hook: ' + JSON.stringify(response));
});
//# sourceMappingURL=app.js.map