# Logging

This project uses structured logging for application operations and one
context-rich wide event for each HTTP request.

The logger is configured in [`utils/logger/index.ts`](../utils/logger/index.ts).
Application startup and process-level failures use the same logger instance.
Feature code should not create its own logger.

## Goals

Every request should produce one event that is sufficient to answer:

- Which request was made?
- Which deployment handled it?
- How long did it take?
- What was the result?
- Which user or business context was involved?
- What failed, if anything?

The request event is emitted after the response is complete. This keeps request
timing and the final status together instead of scattering logs throughout the
request graph.

## Wide request events

The HTTP boundary in `app/server.ts` creates a request context in `onRequest`
and emits the event in `onAfterResponse`.

The event name is:

```text
http_request
```

Its stable fields are:

| Field | Description |
| --- | --- |
| `event` | Event name, currently `http_request` |
| `request_id` | Unique identifier for the request |
| `method` | HTTP method |
| `path` | URL path without the query string |
| `status_code` | Final HTTP status code |
| `outcome` | `success` or `error` |
| `duration_ms` | Request duration in milliseconds |
| `environment` | `development`, `test`, or `production` |
| `service_version` | Application version |
| `commit_sha` | Deployment commit |
| `region` | Deployment region |
| `instance_id` | Runtime instance identifier |
| `error` | Structured error details when a request fails |

An error includes its type, message, and stack when the failure is an
`Error`. Do not add secrets, tokens, passwords, or complete request bodies to
the error context.

The response includes the same identifier in the `x-request-id` header:

```text
x-request-id: 4d8c6f0e-7e66-4a1a-9bc6-7f0c1ad0d4f8
```

Use this value when asking a user to report a failed request or when correlating
application logs with traces.

## Business context

The HTTP boundary owns the common request fields. A feature may add safe
business context when it is available, such as:

```ts
{
    user_id: user.id,
    permission: permission.name,
    scope: scope.name,
}
```

Business context should be:

- Useful for debugging or analytics
- Stable enough to query
- Safe to store in logs
- Added to the request event rather than emitted as a second event

Prefer identifiers and classifications over sensitive values. Never log
passwords, access tokens, refresh tokens, email-token secrets, API keys,
`DATABASE_URL`, or unredacted authorization headers.

## Log levels

Use only the following levels:

- `info` for successful request events and normal lifecycle events
- `error` for process-level failures and unrecoverable failures

Do not use `console.log`, `console.error`, or a second logger in application
code. Do not emit a log line for every domain step. The Effect graph, tracing,
and final request event provide the operation context.

## Process lifecycle events

The application emits structured events for:

- `application_started`
- `application_shutdown`
- `application_failure`

These events are not HTTP requests, so they are emitted directly by
`app/index.ts`. They must still use the shared logger and structured fields.

## Environment configuration

The following values are read by `app/config.ts` and included in request
events:

| Environment variable | Purpose | Default |
| --- | --- | --- |
| `APP_VERSION` | Service release version | `0.1.6` |
| `COMMIT_SHA` | Source commit deployed | `unknown` |
| `REGION` | Deployment region | `unknown` |
| `INSTANCE_ID` | Runtime instance identifier | `unknown` |

Set these values in deployment environments. Local development values are
provided in [`.env.example`](../.env.example).

Example:

```dotenv
APP_VERSION="0.1.6"
COMMIT_SHA="abc1234"
REGION="asia-southeast1"
INSTANCE_ID="api-7f6d9"
```

## Storage and output

Winston writes JSON logs to the rotating files under `logs/` and also writes to
the console. Files rotate daily, are limited to 20 MB per file, and are kept
for 14 days.

Do not commit runtime log files. They may contain request identifiers,
business context, and diagnostic data.

## Adding logging to a feature

Before adding a log, ask whether the information belongs in the final HTTP
event. In most cases, the correct change is to enrich the existing request
context and let the HTTP boundary emit it once.

Follow this process:

1. Name the business field using `snake_case`.
2. Confirm that it is safe to persist.
3. Add it to the request context or event mapping.
4. Keep the field consistent across the feature.
5. Add or update a test for the behavior when the field affects a public
   contract.
6. Run `bun run check`.

Avoid:

```ts
console.log("user loaded")
logger.info({ user })
logger.info({ repositoryResult })
```

Prefer one final event containing the useful context:

```ts
logger.info({
    event: "http_request",
    request_id: requestId,
    user_id: userId,
    outcome: "success",
    status_code: 200,
})
```

The example above represents the shape of the final event. Normal request
events should be emitted through `logHttpRequest` so duration and deployment
metadata remain consistent.

## Verification

Run the standard project gate after logging changes:

```bash
bun run check
```

Also verify manually that:

1. A successful request emits one `http_request` event.
2. A validation or server error emits one event with the final status.
3. The response contains `x-request-id`.
4. Error output does not contain credentials or tokens.
5. The event contains deployment metadata.
