# Client Library Timeout and Retry Policy

Here's how the three libraries' timeouts and retry counts differ. Retries are part of the same item, because together they set how long a failing call can take.

## Timeouts

| | JS (default HTTP client) | Java | Python |
|---|---|---|---|
| Default | 5s (`DEFAULT_TIMEOUT_MS`, added in Phase A) | 3s connect + 3s read | 5s (`httpx.Timeout(5.0)`) |
| What it limits | axios `timeout`: in browsers, the whole request; in Node, the connect phase and then gaps between data on the socket | connect time, and gaps between reads | connect, read, write and connection-pool waits, 5s each |
| Configurable? | **No**: it's a constant in `DefaultHttpClient`. Lite-build users bring their own HTTP client and set their own | Yes, via `ClientProperties.CONNECT_TIMEOUT` / `READ_TIMEOUT` in the constructor's `properties` map | Yes, `timeout=` on the constructor (a number or an `httpx.Timeout`) |

Two caveats:
- **Java and Python are idle timeouts, not a limit on the whole request.** A response that keeps trickling in can take longer than the number suggests. Browser JS is the only one where the timeout limits the whole request.
- **JS before Phase A had no timeout at all.** The axios default is `0`, so a hung request waited forever.

## Retries (for safe requests only, after the earlier Copilot fix)

| | JS | Java | Python |
|---|---|---|---|
| Retries | up to **3**, after waiting 300 ms, 600 ms, 1200 ms | **1**, immediately | **none** |
| Rough worst case for a safe request against a stalled server | ~22s (4 attempts × 5s + 2.1s of waiting) | ~6–12s (2 attempts × 3s read, plus connect if that's slow too) | ~5s |
| Worst case for `/mark`, `/log`, `/reward` (never retried) | ~5s | ~3s read (+ connect) | ~5s |

So for the same stalled call, a JS user could wait about four times longer than a Python user before seeing an error.

## What would make them consistent

1. **One default timeout:** I'd suggest 5s, which JS and Python already use. Java would move from 3s to 5s.
2. **Make the JS timeout configurable,** for example a `timeout` option on the constructor, as Python and Java allow.
3. **One retry policy:** pick a count and a backoff. Options:
   - **1 retry with a short backoff in all three.** This is closest to Java today, and it caps the worst case at about twice the timeout. Python would gain a retry, and JS would drop from 3 to 1.
   - **Keep JS's 3 retries with backoff and adopt it everywhere.** That's more resilient to brief blips, but slow failures get much slower.
   - **No retries anywhere.** Simplest, but a brief network blip fails `/assign` or `/featureflag` outright.

My recommendation is a 5s default everywhere, configurable everywhere, with 1 retry after a short backoff for safe requests. It keeps the resilience that matters for a brief blip without making a dead server take 20+ seconds to report.
