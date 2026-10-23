---
description: >-
  Steps to create a Google Client ID to allow UI login / authenticated
  endpoints.
---

# Setting up Google-Auth

Note: Requires a google account! (personal or business)

1.  Go to [console.cloud.google.com](https://console.cloud.google.com) and click **Console.** You should see something like this, but sometimes this UI is not exactly the same, and may be different if empty. On left is the project selector, and New Project is there on the right.<br>

    <figure><img src="../../.gitbook/assets/image (19).png" alt=""><figcaption></figcaption></figure>
2.  You will **Create a New Project** which you can call "Upgrade API".<br>

    <figure><img src="../../.gitbook/assets/image (20).png" alt=""><figcaption></figcaption></figure>
3. Select **APIs and Services**
4.  Go to **Credentials** > **+ Create Credentials** > **OAuth client ID**<br>

    <figure><img src="../../.gitbook/assets/image (23).png" alt=""><figcaption></figcaption></figure>
5. Create the OAuth client ID:
   * Select application type (Web)
   *   Add **Authorized JavaScript origins** for your app. This depends on your domain setup for deployed instances but for local you will want to include these for the UI:<br>

       <figure><img src="../../.gitbook/assets/image (24).png" alt=""><figcaption></figcaption></figure>
   *   Add **Authorized Redirect URIs.** This is what we have, it should do the trick<br>

       <figure><img src="../../.gitbook/assets/image (25).png" alt=""><figcaption></figcaption></figure>


6. Click **Create** and find your your **Client ID** on the resultant page. This is your **GOOGLE\_CLIENT\_ID.**\
   \
   Your client ID will look like: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`<br>
7. This will be the id that is used in your GOOGLE\_CLIENT\_ID in your backend .env and in your frontend environment.ts files.

This may take a few minutes, then open the frontend and you should see this screen. You may or may not automatically see your google account name and picture populate the login button. Click this and login with a google user account.

<figure><img src="../../.gitbook/assets/Screenshot 2022-11-28 at 7.37.07 PM.png" alt=""><figcaption><p>Upgrade Login Screen</p></figcaption></figure>

<mark style="color:green;">Finally your Upgrade frontend is deployed successfully!!!</mark>

Login using the gmail id with the domain specified during the deployment and you are ready to create experiments.
