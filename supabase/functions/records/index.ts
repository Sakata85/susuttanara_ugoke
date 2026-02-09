// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
// Edge Function: records (GET/POST)
// - GET  : ログインユーザーの履歴一覧
// - POST : ログインユーザーの記録を保存

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !/^Bearer\s+.+/.test(authHeader)) {
    return { user: null, error: "Authorization header required" } as const;
  }
  const url = getEnv("SUPABASE_URL", "PROJECT_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY", "ANON_KEY");
  if (!url || !anonKey) return { user: null, error: "Missing SUPABASE_URL/SUPABASE_ANON_KEY" } as const;
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null, error: error.message } as const;
  return { user: data.user, error: null } as const;
}

function adminClient() {
  const url = getEnv("SUPABASE_URL", "PROJECT_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Missing PROJECT_URL/SERVICE_ROLE_KEY");
  return createClient(url, serviceKey);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });

  try {
    const { user, error: authError } = await getAuthUser(req);
    if (!user) return json({ error: authError ?? "unauthorized" }, { status: 401, headers: cors(req) });

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
      if (error) return json({ error: error.message }, { status: 500, headers: cors(req) });
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
      const { error } = await sb.from(TABLE_NAME).insert([payload]);
      if (error) return json({ error: error.message }, { status: 500, headers: cors(req) });
      return json({ status: "ok" }, { status: 200, headers: cors(req) });
    }

    return json({ error: "method not allowed" }, { status: 405, headers: cors(req) });
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500, headers: cors(req) });
  }
});


