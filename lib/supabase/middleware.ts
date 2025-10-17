import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Fluid compute 環境では、このクライアントをグローバル環境変数に置かないでください。
  // 各リクエストごとに新しいインスタンスを作成してください。
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
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

  // createServerClient と supabase.auth.getClaims() の間でコードを実行しないでください。
  // 些細なミスがあると、
  // ユーザーがランダムにログアウトする問題のデバッグが非常に難しくなります。
  // 重要: getClaims() を削除した状態で Supabase クライアントを用いた SSR を行うと、
  // ユーザーがランダムにログアウトされる可能性があります。
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // 既にログイン済みのユーザーが admin サインインにアクセスした場合はレッスンページへリダイレクト
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
    // 未ログインの場合は、ログインページへリダイレクトさせる
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }

  // 管理者ガード: 専用の admin サインインページを除き、/admin へは
  // profiles.user_authority_type === 'admin' のユーザーのみアクセス可能にする
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/sign-in") &&
    !request.nextUrl.pathname.startsWith("/admin/sign-up") &&
    request.nextUrl.pathname !== "/admin"
  ) {
    // 未ログインなら admin サインインへリダイレクト
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      return NextResponse.redirect(url);
    }

    // JWT の claims (app_metadata) から管理者ロールをチェックする
    const isAdmin =
      (user as Record<string, unknown> & { app_metadata?: Record<string, unknown> })?.app_metadata
        ?.user_authority_type === "admin";

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}