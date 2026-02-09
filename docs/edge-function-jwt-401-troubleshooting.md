# Edge Function で 401 Invalid JWT が出たときの原因と解決策

記録 POST などで「ログインし直してください」「Invalid JWT」となり 401 が返る事象の総まとめです。同じことが起きたときに参照するためのドキュメントです。

---

## 原因の総まとめ

### 1. Supabase の JWT 署名方式の移行

- Supabase Auth は **対称鍵（Legacy）** から **非対称 JWT 署名キー（JWKS）** に移行している。
- 従来の `createClient(url, anonKey).auth.getUser()` による検証は、新しい非対称 JWT で失敗することがある。
- 公式では **JWKS（`/auth/v1/.well-known/jwks.json`）と issuer を使った明示的な JWT 検証** を推奨している。

### 2. ゲートウェイが先に JWT 検証して 401 を返している（本番で最もハマりやすい）

- **Supabase のゲートウェイ**は、Edge Function にリクエストを渡す**前**に、デフォルトで JWT を検証する。
- ゲートウェイの検証は **古い（対称鍵）方式** の可能性が高く、非対称 JWT で失敗する。
- その結果、**Function のコードは一切実行されず**、ゲートウェイから `{"code":401,"message":"Invalid JWT"}` が返る。
- このとき Function のログには何も出ず、カスタムのエラーヘッダーや body もゲートウェイで上書きされる。

### 3. issuer / JWKS URL の不一致（本番の環境変数）

- 本番では `SUPABASE_URL` が **内部用 URL** として注入されることがある。
- Function 内で issuer や JWKS の取得先にその内部 URL を使うと、クライアントの JWT（公開 URL で発行）と **issuer が一致せず** 検証に失敗する。
- そのため **公開 URL** を明示的に指定する必要がある（シークレット `SB_JWT_ISSUER` の設定と、JWKS 取得先の公開 URL 化）。

### 4. デプロイ忘れ

- `_shared/jwt.ts` や `records/index.ts` を変更しても、**Edge Function を再デプロイしていない**と本番には反映されない。
- 修正後は必ず `supabase functions deploy ...` を実行する。

---

## 解決策の総まとめ

### 対応一覧

| 対策 | 内容 |
|------|------|
| 1. ゲートウェイの JWT 検証をオフにする | リクエストを Function まで届け、Function 内で JWKS 検証する |
| 2. Function 内で JWKS 検証に統一する | `getUser()` に頼らず、`jose` + JWKS + issuer で検証する |
| 3. 本番で公開 URL を明示する | シークレット `SB_JWT_ISSUER` を設定し、JWKS 取得も公開 URL にする |
| 4. デプロイ時に verify_jwt をオフにする | 本番デプロイで `--no-verify-jwt` を付ける |

---

### 1. ゲートウェイの JWT 検証をオフにする

**config.toml** に以下を追加する。

```toml
# ゲートウェイの JWT 検証をオフにし、Function 内で JWKS 検証を行う（非対称鍵対応）
[functions.records]
verify_jwt = false
[functions.upload-image]
verify_jwt = false
```

**本番デプロイ時**は、config が効かない場合があるため **CLI で明示する**。

```bash
supabase functions deploy records --no-verify-jwt
supabase functions deploy upload-image --no-verify-jwt
```

- これによりゲートウェイは JWT を検証せず、リクエストが Function まで届く。
- 認証は Function 内の JWKS 検証に一本化する（下記 2 と 3）。

---

### 2. Function 内で JWKS 検証に統一する

- **共有モジュール** `supabase/functions/_shared/jwt.ts` で、`jose` を使い JWKS と issuer で JWT を検証する。
- 各 Edge Function（`records`, `upload-image`）では、`getAuthToken(req)` → `verifySupabaseJWT(token)` で `sub` を取得し、`getUser()` は使わない。
- 参考: [Supabase Securing Edge Functions](https://supabase.com/docs/guides/functions/auth)、公式例 `_shared/jwt/default.ts`。

---

### 3. 本番で公開 URL を明示する（SB_JWT_ISSUER と JWKS 取得先）

- **シークレット**を設定する（ダッシュボード or CLI）。

  - **名前**: `SB_JWT_ISSUER`
  - **値**: `https://<プロジェクトID>.supabase.co/auth/v1`（末尾スラッシュなし）

  CLI の例:

  ```bash
  supabase secrets set SB_JWT_ISSUER=https://hsgakvmobyiflpwdqzeh.supabase.co/auth/v1
  ```

- **_shared/jwt.ts** では、`SB_JWT_ISSUER` が設定されているときは **issuer と JWKS のベース URL の両方** にその公開 URL を反映する。
  - `getBaseUrl()` で `SB_JWT_ISSUER` を優先し、`/auth/v1` を除いた部分をベース URL として使う。
  - `getJwksUrl()` はそのベース URL + `/auth/v1/.well-known/jwks.json` とする。

これで本番の内部 URL に引きずられず、常に公開 URL で検証される。

---

### 4. デプロイ手順の確認

1. コード変更後、対象 Function をデプロイする。

   ```bash
   supabase functions deploy records --no-verify-jwt
   supabase functions deploy upload-image --no-verify-jwt
   ```

2. シークレット `SB_JWT_ISSUER` が未設定なら設定する（上記 3）。
3. 再度クライアントからリクエストして 401 が解消するか確認する。

---

## 同じことが起こったときに確認するチェックリスト

- [ ] ゲートウェイで 401 になっていないか  
  - ログに何も出ない・カスタムヘッダーが返らない → ゲートウェイで弾かれている可能性が高い。
- [ ] `config.toml` の `[functions.<名前>] verify_jwt = false` が入っているか。
- [ ] 本番デプロイで `--no-verify-jwt` を付けてデプロイしたか。
- [ ] シークレット `SB_JWT_ISSUER` が正しい公開 URL で設定されているか（末尾 `/auth/v1` まで、末尾スラッシュなし）。
- [ ] `_shared/jwt.ts` で `SB_JWT_ISSUER` があるときに JWKS 取得先も公開 URL になっているか（`getBaseUrl()` で SB_JWT_ISSUER を優先）。
- [ ] コード変更後に Edge Function を再デプロイしたか。

---

## 関連ファイル

- `supabase/config.toml` … `[functions.records]` / `[functions.upload-image]` の `verify_jwt = false`
- `supabase/functions/_shared/jwt.ts` … JWKS 検証（getBaseUrl / getIssuer / getJwksUrl / verifySupabaseJWT）
- `supabase/functions/records/index.ts` … getAuthUser で上記共有 JWT 検証を使用
- `supabase/functions/upload-image/index.ts` … 同様に共有 JWT 検証を使用

---

## 参考リンク

- [Securing Edge Functions \| Supabase](https://supabase.com/docs/guides/functions/auth)
- [Function Configuration \| Supabase](https://supabase.com/docs/guides/functions/function-configuration)
- [Supabase GitHub: custom-jwt-validation / _shared/jwt/default.ts](https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/_shared/jwt/default.ts)
