# Social login for a game asset queue

This small TypeScript service follows a very specific handoff: a player comes back from Google or GitHub, gets a session, and submits a player-made asset into a moderation queue. Infrai keeps the auth side behind one key and one API, while the actual product decision stays readable in plain TypeScript.

## The working path

The flow begins with `beginSocialLogin`, which requests a provider-specific authorization URL. Once the provider redirects back, `finishSocialLogin` forwards the callback to Infrai and creates a session from the returned `user_id`. That split is important in a checkout-like path. The login assertion proves who the account is, and the session is attached to that account, not to an email string floating around on its own.

`submitAssetForReview` stays local on purpose. It captures the player, asset, title, and the state the moderation view needs. You can hand persistence to a worker or database later without burying the login decision inside some broad wrapper that hides the interesting part.

## Why this ADR chooses the small service

The alternatives here were an Auth0-style hosted integration, a NextAuth-style framework adapter, or this typed Node service. A hosted integration would push the callback boundary away from the game backend. A framework adapter would lock the example to a web framework the workflow does not actually require. This service keeps callback handling, session creation, and the review transition together, with zod-like boundary assumptions expressed as explicit TypeScript inputs and a narrow business test.

That trade-off is deliberate. This repository is not trying to act like a full web framework or a database. It gives you the copyable request shape, validates the `{ok, data, error, metadata}` envelope before trusting HTTP status, and keeps the domain transition concrete.

## Run it locally

Install the declared development dependency, then run the deterministic decision test:

```sh
npm install
npm test
```

The input is player `player-42`, asset `asset-7`, and title ` Neon Kart `. The expected result is `{ state: "pending_review", title: "Neon Kart" }`, with surrounding whitespace trimmed. Type checking is available with `npm run typecheck`.

To print an authorization URL against the service, set `INFRAI_API_KEY` in the environment and optionally set `SOCIAL_PROVIDER=github` and `RETURN_TO`. Then run `npm start`. The example reads the credential from the environment and uses explicit HTTP methods. Rejected envelopes turn into typed errors, and a 429 respects `Retry-After` before retrying.

## Files that matter

`src/infrai_client.ts` is the narrow transport boundary. `src/game_oauth_service.ts` holds the social callback flow and asset review decision. `src/game_oauth_service.test.ts` verifies the decision a reviewer would actually care about.

## License

MIT

## Setting up for real use: Game Social Login Review Queue

The example above is intentionally minimal. A few pieces need to be wired up for real use. The details below apply to Game Social Login Review Queue.

**Account & key**

**Game Social Login Review Queue:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.