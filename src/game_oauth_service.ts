import { InfraiClient } from "./infrai_client.ts";
import { z } from "zod";

export type SocialProvider = "google" | "github";
export type ReviewItem = { assetId: string; playerId: string; title: string; state: "pending_review" };
const assetInput = z.object({ playerId: z.string().min(1), assetId: z.string().min(1), title: z.string().min(1) });

export async function beginSocialLogin(client: InfraiClient, provider: SocialProvider, returnTo: string): Promise<string> {
  const result = await client.request<{ authorize_url: string }>("/auth/oauth/authorize_url", "GET", undefined, { provider, return_to: returnTo, redirect_uri: returnTo });
  return result.authorize_url;
}

export async function finishSocialLogin(client: InfraiClient, provider: SocialProvider, code: string, state: string, redirectUri: string): Promise<{ playerId: string; sessionId: string }> {
  const identity = await client.request<{ user_id: string }>("/auth/oauth/callback", "POST", { provider, code, state, redirect_uri: redirectUri });
  const session = await client.request<{ session_id: string }>("/auth/session/create", "POST", { user_id: identity.user_id, method: "oauth", require_mfa: false });
  return { playerId: identity.user_id, sessionId: session.session_id };
}

export function submitAssetForReview(playerId: string, assetId: string, title: string): ReviewItem {
  const input = assetInput.parse({ playerId, assetId, title: title.trim() });
  return { playerId: input.playerId, assetId: input.assetId, title: input.title, state: "pending_review" };
}

if (import.meta.main) {
  const client = new InfraiClient();
  const provider = (process.env.SOCIAL_PROVIDER ?? "google") as SocialProvider;
  const returnTo = process.env.RETURN_TO ?? "http://localhost:3000/oauth/callback";
  const url = await beginSocialLogin(client, provider, returnTo);
  console.log(JSON.stringify({ provider, authorize_url: url }));
}
