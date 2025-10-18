// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
// Edge Function: Auth user.created → m_user に冪等INSERT
// 必要な環境変数（Dashboard / CLI の secrets に設定してください）
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - HOOK_SECRET  (Auth Hook 設定で使う同じ値)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type AuthUserLike = {
  id?: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

async function verifySignature(bodyText: string, headerSig: string | null, secret: string | null): Promise<boolean> {
  if (!secret) return false;
  if (!headerSig) return false;
  try {
    // 例: "sha256=abcdef..." のような前置詞を許容
    const normalized = headerSig.startsWith("sha256=") ? headerSig.slice(7) : headerSig;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(bodyText));
    const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    // header は 16進文字列想定（大文字/小文字差吸収）
    return hex.toLowerCase() === normalized.toLowerCase();
  } catch {
    return false;
  }
}

function extractUserFromPayload(payload: unknown): AuthUserLike | null {
  const b = payload as Record<string, any> | null | undefined;
  if (!b) return null;
  // よくある形を順に探索
  const candidates: AuthUserLike[] = [
    b.user,
    b.record,
    b.data?.new,
    b.data,
    b,
  ].filter(Boolean);

  for (const c of candidates) {
    if (c && (c as any).id) return c as AuthUserLike;
  }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = Deno.env.get("PROJECT_URL");
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY");
  const hookSecret = Deno.env.get("HOOK_SECRET");
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const raw = await req.text();
  const headerSig = req.headers.get("x-supabase-signature") || req.headers.get("X-Supabase-Signature");
  const ok = await verifySignature(raw, headerSig, hookSecret ?? null);
  if (!ok) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const user = extractUserFromPayload(body);
  if (!user?.id) {
    return new Response(JSON.stringify({ error: "user not found in payload" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(url, serviceKey);

  // 必須最小カラムのみをINSERT（冪等）
  // create_date / update_date はテーブル側で DEFAULT now() を持つ前提
  // create_user / update_user は規約に合わせ 'system' を設定
  const insertPayload: Record<string, unknown> = {
    auth_user_id: user.id,
    email: user.email ?? null,
    create_user: "system",
    update_user: "system",
  };

  const { error } = await supabase
    .from("m_user")
    .upsert([insertPayload], { onConflict: "auth_user_id", ignoreDuplicates: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

// Deno Deploy / Supabase Edge Functions エントリ
serve(handler);


