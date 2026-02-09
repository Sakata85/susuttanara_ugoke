// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
// Edge Function: records (GET/POST)
// - GET  : ログインユーザーの履歴一覧
// - POST : ログインユーザーの記録を保存

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getAuthToken, verifySupabaseJWT } from "../_shared/jwt.ts";

const TABLE_NAME = "t_record";

function cors(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "access-control-allow-origin": origin,
    // apikey は supabase-js が付与するため必須
    "access-control-allow-headers": "authorization, apikey, x-client-info, content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-max-age": "86400",
    "vary": "origin",
  };
}

function json(body: unknown, init: ResponseInit & { headers?: HeadersInit } = {}) {
  const headers = { ...init.headers, "content-type": "application/json" } as HeadersInit;
  return new Response(JSON.stringify(body), { ...init, headers });
}

function getEnv(name: string, alt?: string): string | null {
  return Deno.env.get(name) ?? (alt ? Deno.env.get(alt) ?? null : null);
}

async function getAuthUser(req: Request): Promise<{ user: { id: string } | null; error: string | null }> {
  try {
    const token = getAuthToken(req);
    const { sub } = await verifySupabaseJWT(token);
    return { user: { id: sub }, error: null };
  } catch (e) {
    return { user: null, error: (e as Error).message };
  }
}

function adminClient() {
  const url = getEnv("PROJECT_URL", "SUPABASE_URL");
  const serviceKey = getEnv("SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Missing PROJECT_URL/SERVICE_ROLE_KEY");
  return createClient(url, serviceKey);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });

  try {
    const { user, error: authError } = await getAuthUser(req);
    if (!user) {
      console.error("[records] auth failed:", authError);
      const errMsg = authError ?? "unauthorized";
      const headers = { ...cors(req), "X-Auth-Error": errMsg.slice(0, 200) } as HeadersInit;
      return json({ error: errMsg }, { status: 401, headers });
    }

    if (req.method === "GET") {
      const sb = adminClient();
      const { data, error } = await sb
        .from(TABLE_NAME)
        .select(
          "id, food_name, weight_kg, intake_kcal, exercise_id, duration_minutes, burned_kcal, memo, image_url, create_date"
        )
        .eq("auth_user_id", user.id)
        .order("create_date", { ascending: false })
        .order("id", { ascending: false });
      if (error) return json({ error: "履歴の取得に失敗しました", message: error.message }, { status: 500, headers: cors(req) });
      return json(data ?? [], { status: 200, headers: cors(req) });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const input = body as Record<string, any>;

      const food_name = String(input.food_name ?? "").slice(0, 200).trim();
      const weight_kg = Number(input.weight_kg ?? 0);
      const intake_kcal = Number(input.intake_kcal ?? 0);
      if (!food_name || !(weight_kg > 0) || !(intake_kcal >= 0)) {
        return json({ error: "invalid payload" }, { status: 400, headers: cors(req) });
      }

      const payload: Record<string, any> = {
        auth_user_id: user.id,
        food_name,
        weight_kg,
        intake_kcal,
        exercise_id: input.exercise_id ?? null,
        duration_minutes: input.duration_minutes ?? null,
        burned_kcal: input.burned_kcal ?? null,
        memo: input.memo ?? null,
        image_url: input.image_url ?? null,
        create_user: user.id,
        update_user: user.id,
      };

      const sb = adminClient();
      const { data: inserted, error } = await sb.from(TABLE_NAME).insert([payload]).select("id").single();
      if (error) return json({ error: "保存に失敗しました", message: error.message }, { status: 500, headers: cors(req) });
      return json({ status: "ok", id: inserted?.id ?? null }, { status: 200, headers: cors(req) });
    }

    return json({ error: "method not allowed" }, { status: 405, headers: cors(req) });
  } catch (e) {
    const msg = (e as Error).message;
    return json({ error: "サーバーエラーが発生しました", message: msg }, { status: 500, headers: cors(req) });
  }
});


