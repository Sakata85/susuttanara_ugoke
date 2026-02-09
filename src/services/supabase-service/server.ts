import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** リクエストごとにクライアントを生成すること（Fluid compute 時はグローバルに置かない） */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component からの setAll は無視してよい（middleware でセッション更新している場合） */
          }
        },
      },
    },
  );
}
