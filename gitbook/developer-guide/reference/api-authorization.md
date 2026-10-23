---
description: Technical overview of setting up JWT-based auth for UpGrade endpoints
---

# API Authorization

Optionally, your application can secure endpoint communication by turning on API token-based authentication. This will require requests to pass a signed JWT token that has been encrypted with the application environment's `CLIENT_API_SECRET` and `CLIENT_API_KEY` (or a verified Google Auth credential has been obtained by [GIS ](https://developers.google.com/identity/gsi/web/guides/overview)via the UpGrade UI's [Google Auth login process](https://developers.google.com/identity/gsi/web/guides/overview) via valid Google-email-based login token exchange). \
\
The UpGrade API has two kinds of endpoint authorization flows that are available:\
\
1\. [Client SDK endpoint API token auth](api-authorization.md#client-sdk-endpoint-authorization) for system-to-system communication, typically via the publicly available client library packages for TypeScript and Java\
\
2\. [Google-Credential user-admin authenticated endpoints](api-authorization.md#google-credential-user-admin-authenticated-endpoints) for working with the UI or via direct API calls for all other endpoints.<br>

## **CLIENT-SDK endpoint authorization**

\
Client applications will communicate user interactions to UpGrade via the Client SDK endpoints (such as `init`, `assign` and `mark`), typically using a client library package that can help streamline these actions.

### **Generating a valid token**

To create a signed token to secure communication from the client system -> UpGrade API, the client will need to have knowledge of the UpGrade API `CLIENT_API_SECRET` and `CLIENT_API_TOKEN` values for that environment. With those details obtained, a valid token can be created and tested via a jwt-signing package such as in the following javascript snippet:

```javascript
import jwt from 'jsonwebtoken';
import client from 'upgrade_client_lib/dist/node/index.js';

const { UpgradeClient } = client;
const APIKey = 'key'; // CLIENT_API_KEY
const secret = 'secret'; // CLIENT_API_SECRET
const userId = 'asdfTest';
const host = 'http://localhost:3030';
const context = 'assign-prog';

const main = async () => {
  const payload = { APIKey };
  const token = jwt.sign(payload, secret);

  const upgradeClient = new UpgradeClient(userId, host, context, { token });

  try {
    const response = await upgradeClient.init();
    console.log('--> Payload <--')
    console.log(payload);
    console.log('--> Signed Token <--')
    console.log(token);
    console.log('--> UpGrade response <--')>
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};

main();
```

### **Passing the token to UpGrade:**

Using direct API call or cURL: Send in header as an API Token Authorization with `Authorization` as key and the token as value:

```powershell
--header 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBUElLZXkiOiJrZXkiLCJpYXQiOjE3MDg0NTE5Nzl9.yMdjPsmn1GC87_e-LBECVX-nQw5ELzdUdwAm_y_K4Gg'
```

Using TypeScript or Java client library: Pass the signed token in the constructor

<pre class="language-typescript"><code class="lang-typescript"><strong>// TypeScript and JavaScript
</strong><strong>const upgradeClient = new UpgradeClient(userId, host, context, { token });
</strong></code></pre>

<pre class="language-java"><code class="lang-java"><strong>// Java signatures require `authToken`. This can be any blank string when auth is off.
</strong>public ExperimentClient(String userId, String authToken, String sessionId, String baseUrl, Map&#x3C;String, Object> properties)
<strong>public ExperimentClient(String userId, String authToken, String baseUrl, Map&#x3C;String, Object> properties)
</strong></code></pre>

### &#x20;**Enabling / Disabling CLIENT SDK endpoint authentication:**

Once your client calls are equipping requests with valid tokens, you can enable auth in UpGrade. Client-SDK authorization for environment is toggled via a setting in the upgrade database `settings` table&#x20;

{% hint style="info" %}
NOTE: This is not the same as the `AUTH_CHECK`env var, which is for toggling admin/UI endpoints (see below)! There is no env var currently for setting this boolean flag. This may change in the future.&#x20;
{% endhint %}

1\. Via admin user toggle in an environment.

{% hint style="warning" %}
NOTE: This may not be a safe approach for use in a multi-tenent environment as this is a global setting for all users. This feature may be removed for these reasons in the future.
{% endhint %}

\
![](<../../.gitbook/assets/image (26).png>)\
2\. Send in a POST request to `/settings`

```
{
  "toCheckAuth": false
}
```

3. Directly modify the `toCheckAuth` boolean in the `settings` table.

### &#x20;Verify

To test if your application is set up correctly, enable auth using one of the above methods in your environment. [Using the above TypeScript snippet as an example](api-authorization.md#generating-a-valid-token), try sending in a valid request to the `init` endpoint (no need to have any experiments running). If success, you should see your data. If fail, you should see a 401 error:<br>

```json
// This means no auth header was recognized
{
    "type": "Token is not present in request",
    "httpCode": "401"
}

// This error indicates the auth header was recognized but the token was invalid
{
    "name": "JsonWebTokenError",
    "message": "invalid signature",
    "type": "Invalid token",
    "httpCode": "401"
}

```



## Google-Credential-based system-admin / UI authenticated endpoints

All other endpoints are secured using Google-Credential based token-exchange in order to use UpGrade's UI and use other admin-level endpoints.<br>

### Generating valid Google-Auth user-credential tokens

Setting up Google Auth for your UpGrade instance is a separate discussion. \
\
In summary, the Google Auth servers will have our same `CLIENT_API_SECRET` and `CLIENT_API_KEY` as above. When a valid gmail user that is known to UpGrade logs in using your UpGrade instance's `GOOGLE_CLIENT_ID`, a JWT credential will automatically be passed to all UpGrade requests from the UI.\
\
Once obtained, this token can also be used by a developer for direct API access as a Bearer token.&#x20;

### Enabling Admin-User auth

When your application is correctly receiving user-credential tokens from the GSI process in the UI, you can secure your endpoints by setting `AUTH_CHECK` env var to true. When true, only users who are present in `ADMIN_USER` in the env will be able to obtain a valid token from Google. All others will receive a 401 error.\
\
\
\
\
\
\
\
\
\
<br>
