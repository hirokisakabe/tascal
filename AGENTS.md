# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

tascal (task + calendar) — カレンダービューがメインのタスク管理 Web アプリ。API ファースト設計。

## 技術スタック

- **モノレポ**: `apps/api` (バックエンド) + `apps/web` (フロントエンド) + `apps/cli` (CLI) + `apps/mobile` (iOS)、pnpm workspaces で依存管理を統一
- **API**: Hono + Node.js + TypeScript、Zod バリデーション
- **Web**: React 19 + Vite + TanStack Router (ファイルベースルーティング) + TanStack React Query + dnd-kit + Tailwind CSS v4 + Headless UI
- **CLI**: citty (CLI フレームワーク) + consola (ロギング)、npm パッケージ `tascal-cli` として公開
- **DB**: PostgreSQL 17 (Docker Compose) + Drizzle ORM
- **認証**: better-auth (メール/パスワード + Bearer トークン)
- **Mobile**: Expo SDK 54 + expo-router + React Native、Expo Go で開発
- **テスト**: Vitest (API: app.request() + DB モック、Web: React Testing Library + jsdom、CLI: fs/fetch モック)
- **Node.js**: v24 (.node-version)

## コマンド

ルートの `package.json` scripts から実行：

| コマンド | 内容 |
|---|---|
| `pnpm install` | 全 app の依存インストール |
| `pnpm dev` | DB 起動 + API + Web の開発サーバー起動 |
| `pnpm build` | 全 app ビルド |
| `pnpm lint` | ESLint (全 app) |
| `pnpm format` | Prettier 自動修正 |
| `pnpm format:check` | Prettier チェックのみ |
| `pnpm typecheck` | TypeScript 型チェック |
| `pnpm test` | テスト実行 (API + Web + CLI) |
| `pnpm knip` | 未使用コード・依存の検出 |
| `pnpm db:up` / `pnpm db:down` | PostgreSQL の起動/停止 |
| `pnpm db:migrate` | Drizzle マイグレーション適用 |
| `pnpm db:seed` | テストデータ投入 |

個別 app でのテスト実行：
```bash
pnpm --filter @tascal/api exec vitest run src/routes/tasks.test.ts  # 単一テスト
pnpm --filter @tascal/web exec vitest run src/components/Calendar.test.tsx
```

ウォッチモード: `pnpm --filter @tascal/api run test:watch`

## アーキテクチャ

### API (apps/api)

- `src/index.ts` — エントリポイント。サーバー起動のみ
- `src/app.ts` — Hono アプリ定義。CORS 設定、セッション取得ミドルウェア、ルートマウント、SPA 静的ファイル配信
- `src/routes/tasks.ts` — タスク CRUD (`GET /api/tasks?year&month`, `POST`, `PATCH /:id`, `DELETE /:id`)。認証ミドルウェアで保護
- `src/auth.ts` — better-auth 設定 (Drizzle アダプタ、Bearer トークンプラグイン)
- `src/db/schema.ts` — Drizzle スキーマ定義 (users, tasks, sessions, accounts, verifications)
- `src/db/index.ts` — DB コネクション (シングルトン)
- `src/db/seed.ts` — テストデータ投入スクリプト
- `drizzle/` — マイグレーションファイル
- `/healthz` — ヘルスチェックエンドポイント（認証不要、DB 疎通確認）

### Web (apps/web)

- `src/routes/` — TanStack Router のファイルベースルーティング
  - `__root.tsx` — ルートレイアウト、NotFound 表示
  - `index.tsx` — ランディングページ (`/`、未認証でもアクセス可能)
  - `app.tsx` — 認証ガード layout (`/app`、セッション未取得で /login へリダイレクト)
  - `app/index.tsx` — メインページ (カレンダー表示、`/app`)
  - `login.tsx`, `signup.tsx` — 認証ページ (ログイン後は `/app` へリダイレクト)
- `src/components/` — Calendar, TaskFormModal, TaskDetailModal, DraggableTask, CalendarDayCell, DayTaskListModal, ModalWrapper 等
- `src/hooks/useTasks.ts` — React Query によるタスク CRUD フック
- `src/api/tasks.ts` — API クライアント (fetch ベース)
- `src/auth-client.ts` — better-auth クライアント
- `src/types/task.ts` — Task 型定義
- `src/utils/calendar.ts` — カレンダーユーティリティ関数 (getCalendarDays, formatDateKey, isToday)
- `src/routeTree.gen.ts` — 自動生成ファイル（編集不可）

### CLI (apps/cli)

- `src/index.ts` — エントリポイント。citty による CLI 定義
- `src/commands/` — サブコマンド (login, logout, list, add, edit, delete, done, undo, category)
- `src/commands/category/` — カテゴリ管理サブコマンド (list, add, edit, delete)
- `src/api.ts` — API クライアント (Bearer トークン認証)
- `src/config.ts` — 設定管理 (`~/.tascalrc` に JSON 保存)

### Mobile (apps/mobile)

- `app/` — expo-router のファイルベースルーティング
  - `_layout.tsx` — ルートレイアウト (Stack ナビゲーション、ダーク/ライトテーマ対応)
  - `(tabs)/` — タブナビゲーション (Home, Explore)
  - `modal.tsx` — モーダル画面
- `components/` — ThemedText, ThemedView, ParallaxScrollView 等の共通コンポーネント
- `constants/theme.ts` — テーマカラー定義
- `hooks/` — useColorScheme, useThemeColor

### DB スキーマ

tasks テーブルの主要カラム: `id`, `userId`, `title`, `description`, `date` (DATE型), `status` ('todo' | 'done'), `createdAt`, `updatedAt`

### 開発時のプロキシ

Vite dev server が `/api` を `http://localhost:3000` にプロキシ。

## 環境変数

`apps/api/.env` に設定（`.env.example` 参照）：
- `DATABASE_URL` — PostgreSQL 接続文字列
- `CORS_ORIGIN` — 許可オリジン
- `BETTER_AUTH_SECRET` — 認証シークレット
- `BETTER_AUTH_URL` — 認証ベース URL
- `TRUSTED_ORIGINS` — better-auth 信頼オリジン
- `PORT` — API ポート (デフォルト 3000)
- `LOG_LEVEL` — ログレベル (`debug` | `info` | `warn` | `error`、デフォルト: 開発時 `debug`、本番 `info`)

## CI

GitHub Actions (`.github/workflows/ci.yml`) が PR で api, web, cli, mobile の 4 ジョブを実行。各ジョブで lint, format-check, typecheck 等を実行（test, knip は mobile 以外）。

## テスト方針

- API: `app.request()` + DB 層モックによる単体テスト
- Web: React Testing Library による結合テスト (テスティングトロフィーに従い、単体テストより結合テストを優先)
- CLI: `fs/promises` + `fetch` モックによる単体テスト

## デプロイ

Docker マルチステージビルドで単一イメージ (Web 静的ファイル + API) を Google Cloud Run にデプロイ。
