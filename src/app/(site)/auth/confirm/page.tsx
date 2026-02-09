import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <h2 className="mb-10 text-center text-xl font-bold text-black">メール確認のお願い</h2>

      <div className="flex flex-col gap-6 rounded-md border border-black bg-background p-6">
        <p className="text-sm leading-relaxed">
          ご登録いただいたメールアドレス宛に確認メールを送信しました。メールに記載のリンクをクリックして登録を完了してください。
        </p>
        <ul className="list-disc pl-5 text-xs text-neutral-700">
          <li>メールが届かない場合は、迷惑メールフォルダをご確認ください。</li>
          <li>数分待っても届かない場合は、アドレスの入力ミスの可能性があります。</li>
        </ul>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/auth/sign-in"
          className="flex h-12 w-60 items-center justify-center rounded border border-black bg-white font-bold text-black"
        >
          ログインへ
        </Link>
      </div>
    </main>
  );
}
