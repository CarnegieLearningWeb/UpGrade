# Client Lib Tester

This application allows you to test various client library versions against simulated client code usage.

The use-cases for this application are to:

1. anticipate how rolling out new changes will affect consumers
2. verify backwards compatibility
3. debug release/production issues
4. POC and/or test new release features

... WITHOUT deployments or asking consumers to make changes on our behalf.

The end goal is to allow us to release new library / API changes with minimal disruption to consumers.

---

## Quick Start for UI and frontend mocks

To start the UI and just frontend TS libs, do:

`cd clientlibs/libTesters/client-lib-tester-frontend`

`npm install`

`npm start`

Angular app should load at port 4201.

This will install all client-versions and types in package.json from npm.
This also will automatically build and pull in your local branch client library as "upgradeClient_Local".

Note: If adding a new published version, `npm install` it and then visit `app-config.ts` in frontend to register it as an option for frontend.

---

## Quick start for TS backend server for non-browser TS-lib mocks

Note: this is a WIP

`cd clientlibs/libTesters/ts-lib-tester-backend-server`

`npm install`

`npm run start:build`

Express app should load at port 3000

This will install all client-versions and types in package.json from npm.
This also will automatically build and pull in your local branch client library as "upgradeClient_Local".

Note: If adding a new published version, `npm install` it and then visit `app-config.ts` in ts-backend dir to register it as an option for backend.

---

## Quick start for Java backend server for Java mocks

Note: TODO!

---

## Using the UI

To test a library version, you will need to do 4 things:

1. Select a "Mock App" (frontend mocks are preloaded, additional mocks will show if a backend is running)
2. Select a Library Version
3. Select an API Host url
4. Run an experiment at that host instance with a design that matches the mock-app's context, dps, etc.

Existing mock apps will load with a user form that dynamically loads in group-types for that particular "mock-app" (click expand to see other user details). You will at least need a userId.

## Mock-Apps

A mock app is an interface that will route to testable code snippets that use the client library in some fashion.

One can run these test code snippets via clicking buttons that simulate user events ("hooks"). The mock app is responsible for listening for user events and routing them to the appropriate code snippets under test.

By keeping testable code snippets organized within distinct mock-apps, we can create versioned examples of client-code usage that can allow us to reasonably simulate end-to-end testing of real-world client code, as well give a quick-and-dirty way to try out and debug specific code problems.

## Hooks

Mock apps are interacted with via button that will dispatch "hooks".

Hooks are meant to model user events that would run some client code. They have a name and an optional payload.

## A note about UpgradeClient type in the mock-app code!

The default is to have `any` as the type for the upgrade client. This is because we don't know beforehand which version will be used, and creating a union type is not going to be helpful. You will see commented code like this in the mock apps I've created so that I can at least "comment-in" types while coding to have type-intellisense in the IDE to target type-safe code for code snippets, and also easily identify where a code snippet will not compile for certain versions.

```
// There's probably a clever way to do this, but getting the right types automatically is tricky

// import { UpgradeClient } from 'upgrade_client_local';
// import { UpgradeClient } from 'upgrade_client_1_1_7';
// import { UpgradeClient } from 'upgrade_client_3_0_18';
// import { UpgradeClient } from 'upgrade_client_4_2_0';

@Injectable({
  providedIn: 'root',
})
export class MockPortalService extends AbstractMockAppService {
  // public upgradeClient!: UpgradeClient;
  public upgradeClient!: any;
```

---

## Creating a new Mock-App

Mock apps should be easy to quickly create, and we should have as many as we want. They inherit from an abstract class (`abstract-mock-app.service.ts` in frontend), so this should help enforce what is needed.

To create a new mock app in frontend, do this:

1. `cd ~/client-lib-tester-frontend/src/app/mockFrontendClientAppComponents`
2. `ng g s <your app name> --skip-tests=true`

This should give you a blank service that is ready to go.

At this point, I would just copy-paste the guts of an existing mock-app. Then:

3. Modify the metadata in the app properties and the `getAppInterfaceModel()` method. This is the stuff that describes the mock app and it's hooks / buttons in the tester ui.

4. Modify the `routeHook(hookEvent: ClientAppHook)` method. This should use the hook name string to route to an invocation of a custom method in your app that tests client library code.

Lastly, give your mock app a name and add it to a couple places:

5. In `shared/constants.ts`, add your mock app name to `MOCK_APP_NAMES` contants list.

6. In `mock-client-app.service.ts`, add this contant name to the array of `availableMockApps` and also add the service to the constructor.

NOTE: It may be possible to create an angular schematic to do this via CLI without so many steps, such as `ng generate mock-app` <name>, but that's for another day.
