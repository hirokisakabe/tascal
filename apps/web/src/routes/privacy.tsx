import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border-light bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-on-surface">
            tascal
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <article className="rounded-lg bg-white p-8 shadow-xl">
          <h1 className="mb-8 text-2xl font-bold text-on-surface">
            プライバシーポリシー
          </h1>

          <div className="space-y-6 text-sm leading-relaxed text-on-surface-secondary">
            <p>
              tascal（以下「本サービス」）は、ユーザーの個人情報の保護を重要と考え、個人情報の保護に関する法律を遵守し、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
            </p>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                1. 収集する情報
              </h2>
              <p>
                本サービスは、サービスの提供にあたり、以下の情報を収集します。
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>
                  <strong>アカウント情報:</strong>{" "}
                  名前、メールアドレス、パスワード（ハッシュ化して保存）
                </li>
                <li>
                  <strong>アクセス情報:</strong>{" "}
                  IPアドレス、ユーザーエージェント
                </li>
                <li>
                  <strong>サービス利用データ:</strong>{" "}
                  タスク情報（タイトル、説明、日付、ステータス）、カテゴリ情報
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                2. 情報の利用目的
              </h2>
              <p>収集した情報は、以下の目的で利用します。</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>本サービスの提供・運営</li>
                <li>ユーザー認証およびセッション管理</li>
                <li>本サービスの改善・新機能の開発</li>
                <li>不正利用の防止およびセキュリティの確保</li>
                <li>重要なお知らせの通知</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                3. 情報の第三者提供
              </h2>
              <p>
                本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>
                  人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                4. 情報の管理
              </h2>
              <p>
                本サービスは、ユーザーの個人情報を適切に管理し、不正アクセス、紛失、破壊、改ざんおよび漏洩の防止に努めます。パスワードはハッシュ化して保存し、通信はHTTPSにより暗号化されています。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                5. ユーザーの権利
              </h2>
              <p>ユーザーは、以下の権利を有します。</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>自己の個人情報の開示を求めること</li>
                <li>自己の個人情報の訂正・削除を求めること</li>
                <li>
                  アカウントの削除（設定画面よりいつでもアカウントを削除でき、関連するすべてのデータが削除されます）
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                6. データの保存期間
              </h2>
              <p>
                ユーザーのデータは、アカウントが有効な期間中保存されます。アカウントを削除した場合、関連するすべてのデータは速やかに削除されます。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                7. プライバシーポリシーの変更
              </h2>
              <p>
                本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく変更することができるものとします。変更後のプライバシーポリシーは、本サービス上に掲示した時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                8. お問い合わせ
              </h2>
              <p>
                本ポリシーに関するお問い合わせは、以下のメールアドレスまでお願いいたします。
              </p>
              <p className="mt-2">
                <a
                  href="mailto:hiroki.sakabe@icloud.com"
                  className="text-primary hover:text-primary-dark hover:underline"
                >
                  hiroki.sakabe@icloud.com
                </a>
              </p>
            </section>

            <p className="mt-8 text-xs text-on-surface-secondary">
              制定日: 2026年4月14日
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
