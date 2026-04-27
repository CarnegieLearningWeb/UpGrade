# Java Client Library

## Stack

Single-module Maven project. Java 17. One main class (`ExperimentClient`) wrapping a Jersey 3.x / Jakarta EE HTTP client. All API calls are async with a callback pattern — no CompletableFutures or reactive types in the public API.

## Build Commands

No Maven wrapper (`mvnw`) — uses system `mvn`:

```bash
mvn clean package     # compile + run tests + produce uber-jar in target/
mvn compile           # compile only
mvn test              # run tests (TestNG)
mvn install           # install to local ~/.m2 repository
```

Output artifact: `target/upgrade-client-<version>.jar` (fat JAR via Maven Shade plugin — all dependencies bundled).

**Version:** Kept in sync with other packages. If bumping, update `pom.xml` `<version>` tag and check `pom.xml.versionsBackup`.

## Public API — `ExperimentClient`

Package: `org.upgradeplatform.client`

All methods are async and accept a `ResponseCallback<T>` as the last argument. **If you pass `null` as the callback, failures are silently swallowed** — always provide a callback in production code.

**Constructor:**
```java
new ExperimentClient(userId, context, authToken, baseUrl, properties)
new ExperimentClient(userId, context, authToken, sessionId, baseUrl, properties)
```

**Key methods:**
- `init(...)` — initialize user (3 overloads: no group, group only, group + workingGroup)
- `setGroupMembership(group, cb)` / `setWorkingGroup(workingGroup, cb)` / `setAltUserIds(altUserIds, cb)`
- `getAllExperimentConditions(cb)` — fetch all assignments (cached)
- `getAllExperimentConditions(ignoreCache, cb)` — bypass cache
- `getAllExperimentConditions(site, cb)` / `getAllExperimentConditions(site, target, cb)`
- `getExperimentCondition(site, cb)` / `getExperimentCondition(site, target, cb)` — site/target matched case-insensitively
- `markDecisionPoint(site, condition, status, cb)` — many overloads adding target, clientError, uniquifier
- `getAllFeatureFlags(cb)` / `getAllFeatureFlags(ignoreCache, cb)` / `hasFeatureFlag(key, cb)`
- `addGroupMetrics(metrics, cb)` / `addSingleMetrics(metrics, cb)` / `log(value, cb)`
- `close()` — implements AutoCloseable; always call this or use try-with-resources to avoid resource leaks

## Key Gotchas

**Caching:** `allExperiments` and `allFeatureFlags` are cached in-memory for the client's lifetime. No expiry. Use the `ignoreCache` overloads when fresh data is needed.

**Retry logic:** `PublishingRetryCallback` retries once (max 1 retry) on network failures and 5xx errors. 4xx errors fail immediately with no retry.

**API version is hard-coded:** All endpoints use `api/v6` (constant in `Utils.java`). Updating to a new API version requires a code change and recompile.

**Timeouts:** Hard-coded 3-second connect/read timeouts in `APIService`. Not configurable via constructor.

**Session ID:** Auto-generated UUID per client instance if not provided. Appears in all request headers for tracing.

## Project Structure

```
src/main/java/org/upgradeplatform/
  client/          ExperimentClient + QuickTest (integration test scratchpad)
  interfaces/      ResponseCallback<T> interface
  requestbeans/    Request DTOs (13 classes)
  responsebeans/   Response DTOs (13 classes)
  utils/           APIService (HTTP), Utils (constants/enums), PublishingRetryCallback
```

## Tests

TestNG is the test framework but there is no `src/test/java` directory — `QuickTest.java` lives in the main source tree and is the de facto integration test. It chains calls with `CompletableFuture` to test the full flow against a running server.

To run a manual integration test:
```bash
mvn exec:java -Dexec.mainClass="org.upgradeplatform.client.QuickTest"
```

There is no automated CI for this library (unlike the JS client which publishes via GitHub Actions). Publishing is currently a manual process.

## HTTP Stack

Jersey 3.x + Jakarta EE (not legacy `javax.ws.rs`) backed by Apache HttpClient 4.x. Jackson handles JSON serialization via `jersey-media-json-jackson`.
