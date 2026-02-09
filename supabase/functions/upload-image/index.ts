// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { getAuthToken, verifySupabaseJWT } from "../_shared/jwt.ts";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

function getEnv(name: string, alt?: string) {
  return Deno.env.get(name) ?? (alt ? Deno.env.get(alt) ?? null : null);
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { "content-type": "application/json", ...corsHeaders(origin) } });

  const url = getEnv("PROJECT_URL", "SUPABASE_URL");
  const service = getEnv("SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500, headers: { "content-type": "application/json", ...corsHeaders(origin) } });

  let userId: string;
  try {
    const token = getAuthToken(req);
    const { sub } = await verifySupabaseJWT(token);
    userId = sub;
  } catch (_e) {
    return new Response(JSON.stringify({ error: "UNAUTHENTICATED" }), { status: 401, headers: { "content-type": "application/json", ...corsHeaders(origin) } });
  }

  // form-data
  const contentType = req.headers.get("content-type") ?? "";
  if (!/multipart\/form-data/i.test(contentType)) return new Response(JSON.stringify({ error: "Content-Type must be multipart/form-data" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders(origin) } });
  const form = await req.formData();
  const file = form.get("image_file") as File | null;
  const bucket = String(form.get("bucket") ?? "public");
  if (!file || !file.size) return new Response(JSON.stringify({ error: "画像ファイルが見つかりません" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders(origin) } });
  const mime = (file.type || "").toLowerCase();
  if (!["image/png", "image/jpeg"].includes(mime)) return new Response(JSON.stringify({ error: "PNG または JPG のみアップロード可能です" }), { status: 400, headers: { "content-type": "application/json", ...corsHeaders(origin) } });

  const sb = createClient(url, service, { auth: { persistSession: false } });
  const uuid = crypto.randomUUID();
  const ext = mime === "image/png" ? "png" : "jpg";
  const originalPath = `${uuid}/original.${ext}`;
  const thumbPath = `${uuid}/thumbnail.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  // thumbnail（失敗してもオリジナルのみで進める）
  let thumbBytes: Uint8Array | null = null;
  try {
    const img = await Image.decode(bytes);
    const ratio = Math.min(320 / img.width, 320 / img.height, 1);
    img.resize(Math.max(1, Math.round(img.width * ratio)), Math.max(1, Math.round(img.height * ratio)));
    thumbBytes = mime === "image/png" ? await img.encodePNG() : await img.encodeJPEG(80);
  } catch (_e) {
    thumbBytes = null; // フォールバック: サムネイルは作らない
  }

  const up1 = await sb.storage.from(bucket).upload(originalPath, bytes);
  if (up1.error) return new Response(JSON.stringify({ error: "STORAGE_ERROR" }), { status: 500, headers: { "content-type": "application/json", ...corsHeaders(origin) } });
  let thumbUploaded = false;
  if (thumbBytes) {
    const up2 = await sb.storage.from(bucket).upload(thumbPath, thumbBytes);
    if (!up2.error) thumbUploaded = true;
  }

  const base = `${url}/storage/v1/object/public/${bucket}/${uuid}`;
  return new Response(JSON.stringify({
    success: true,
    uuid,
    original_url: `${base}/original.${ext}`,
    thumbnail_url: thumbUploaded ? `${base}/thumbnail.${ext}` : `${base}/original.${ext}`,
    bucket,
  }), { status: 200, headers: { "content-type": "application/json", ...corsHeaders(origin) } });
});


