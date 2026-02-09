/** ビルド時のプリレンダを避け、Supabase クライアント生成をリクエスト時のみにする */
export const dynamic = "force-dynamic";

export default function RecordHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
