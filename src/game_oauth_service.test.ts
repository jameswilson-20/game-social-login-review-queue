import assert from "node:assert/strict";
import { submitAssetForReview } from "./game_oauth_service.ts";

const queued = submitAssetForReview("player-42", "asset-7", " Neon Kart ");
assert.deepEqual(queued, { playerId: "player-42", assetId: "asset-7", title: "Neon Kart", state: "pending_review" });
assert.throws(() => submitAssetForReview("player-42", "asset-7", "   "));
console.log("asset review decision: pending_review");
