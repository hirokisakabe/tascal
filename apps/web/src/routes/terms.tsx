import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
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
          <h1 className="mb-8 text-2xl font-bold text-on-surface">利用規約</h1>

          <div className="space-y-6 text-sm leading-relaxed text-on-surface-secondary">
            <p>
              この利用規約（以下「本規約」）は、tascal（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様には、本規約に同意のうえ、本サービスをご利用いただきます。
            </p>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第1条（適用）
              </h2>
              <p>
                本規約は、ユーザーと本サービス運営者との間の本サービスの利用に関わる一切の関係に適用されます。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第2条（利用登録）
              </h2>
              <p>
                本サービスの利用を希望する方は、本規約に同意のうえ、所定の方法により利用登録を申請していただきます。利用登録の完了をもって、利用契約が成立するものとします。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第3条（アカウント管理）
              </h2>
              <p>
                ユーザーは、自己の責任において、本サービスのアカウント（メールアドレスおよびパスワード）を適切に管理するものとします。アカウントの不正利用により生じた損害について、運営者は一切の責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第4条（禁止事項）
              </h2>
              <p>ユーザーは、以下の行為をしてはなりません。</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>
                  本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
                </li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>
                  本サービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為
                </li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第5条（本サービスの提供の停止等）
              </h2>
              <p>
                運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>
                  本サービスにかかるコンピュータシステムの保守点検または更新を行う場合
                </li>
                <li>
                  地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
                </li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第6条（免責事項）
              </h2>
              <p>
                運営者は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しておりません。
              </p>
              <p className="mt-2">
                運営者は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する運営者とユーザーとの間の契約が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第7条（サービス内容の変更等）
              </h2>
              <p>
                運営者は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第8条（利用規約の変更）
              </h2>
              <p>
                運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の利用規約は、本サービス上に掲示した時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-bold text-on-surface">
                第9条（準拠法・裁判管轄）
              </h2>
              <p>本規約の解釈にあたっては、日本法を準拠法とします。</p>
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
