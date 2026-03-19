# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

### 開発（すべて Makefile 経由）

```bash
make dev            # DB + API + Web をまとめて起動（Ctrl+C で全停止）
make install        # 両アプリの npm install
make db-up          # PostgreSQL コンテナのみ起動
make db-down        # PostgreSQL コンテナ停止
make db-migrate     # Drizzle マイグレーション実行
```

### ビルド・検証

```bash
make lint           # 両アプリの ESLint
make format         # 両アプリの Prettier フォーマット
make format-check   # フォーマット差分確認
make typecheck      # 両アプリの tsc --noEmit
make test           # 両アプリの Vitest
```

### 個別アプリ操作（apps/api or apps/web ディレクトリで実行）

```bash
npm run lint
npm run format
npm run format:check
npm run typecheck
npm test                # vitest run（単発実行）
npm run test:watch      # vitest（ウォッチモード）
```

### 単一テストファイル実行

```bash
cd apps/api && npx vitest run src/routes/__tests__/tasks.test.ts
cd apps/web && npx vitest run src/components/__tests__/Calendar.test.tsx
```

### DB マイグレーション生成

```bash
cd apps/api && npm run db:generate
```

## アーキテクチャ

モノレポ構成（npm workspaces ではなく Makefile で管理）。`apps/api` と `apps/web` は独立した npm プロジェクト。

### API (`apps/api`) — Hono + Drizzle ORM + PostgreSQL

- **エントリ**: `src/index.ts` — Hono サーバー（ポート 3000）、CORS・セッションミドルウェア設定
- **認証**: `src/auth.ts` — better-auth（email/password）、Drizzle アダプタ。`/api/auth/**` でハンドリング
- **DB**: `src/db/schema.ts` に Drizzle スキーマ定義（users/sessions/accounts/verifications + tasks テーブル）。`src/db/index.ts` で接続シングルトン
- **ルート**: `src/routes/` 以下。現在は `tasks.ts`（CRUD、認証必須）のみ
- **テスト**: `src/routes/__tests__/` に Vitest テスト。DB をモック化して HTTP リクエストをテスト

### Web (`apps/web`) — React 19 + TanStack Router + Tailwind CSS 4

- **ルーティング**: TanStack Router のファイルベースルーティング（`src/routes/`）。Vite プラグインが自動生成
- **認証ガード**: `src/routes/_authenticated.tsx` — 未認証時は `/login` へリダイレクト
- **API クライアント**: `src/api/tasks.ts` — fetch ベースの CRUD 関数。`src/auth-client.ts` — better-auth クライアント
- **主要コンポーネント**: `src/components/` — Calendar（月間表示 + dnd-kit でドラッグ&ドロップ）、TaskFormModal（作成）、TaskDetailModal（編集・削除）
- **テスト**: `src/components/__tests__/` に Vitest + React Testing Library + jsdom
- **開発時プロキシ**: Vite が `/api` を `http://localhost:3000` に転送

### 認証フロー

API・Web 両方で better-auth を使用。API 側が認証サーバー、Web 側は `createAuthClient({ baseURL: "http://localhost:3000" })` で接続。Cookie ベースのセッション管理。

### CI

GitHub Actions（`.github/workflows/ci.yml`）で PR 時に API・Web を並列で lint / format:check / typecheck / test を実行。Node.js バージョンは `.node-version`（v24）から取得。
