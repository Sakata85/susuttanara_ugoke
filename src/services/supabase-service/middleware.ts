import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /* getClaims() を省略したり getClaims より前に処理を挟むと、ユーザーがランダムにログアウトする原因になる */
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) =>
      redirectResponse.cookies.set(name, value, options)
    );
    return redirectResponse;
  }

  if (request.nextUrl.pathname.startsWith("/admin/sign-in") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/lessons";
    return NextResponse.redirect(url);
  }

  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/legal") &&
    !request.nextUrl.pathname.startsWith("/admin/sign-in") &&
    request.nextUrl.pathname !== "/admin" &&
    !request.nextUrl.pathname.startsWith("/admin/sign-up")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }

  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/sign-in") &&
    !request.nextUrl.pathname.startsWith("/admin/sign-up") &&
    request.nextUrl.pathname !== "/admin"
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      return NextResponse.redirect(url);
    }

    const isAdmin =
      (user as Record<string, unknown> & { app_metadata?: Record<string, unknown> })?.app_metadata
        ?.user_authority_type === "admin";

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  /* リダイレクト等で新しい Response を返す場合は、supabaseResponse の cookies をコピーしてから返すこと */
  return supabaseResponse;
}
