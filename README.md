# tascal

[![CI](https://github.com/hirokisakabe/tascal/actions/workflows/ci.yml/badge.svg)](https://github.com/hirokisakabe/tascal/actions/workflows/ci.yml)

## ローカル開発

### 前提条件

- Node.js
- pnpm (corepack で自動有効化)
- Docker

### セットアップ

```bash
corepack enable pnpm
pnpm install
```

`apps/api/.env.example` を参考に `apps/api/.env` を作成します。

```bash
cp apps/api/.env.example apps/api/.env
# 必要に応じて値を編集
```

初回のみ DB マイグレーションを実行します。

```bash
pnpm db:up
pnpm db:migrate
pnpm db:down
```

### 開発サーバーの起動

DB（PostgreSQL）・API・Web をまとめて起動します。`Ctrl+C` で全て停止します。

```bash
pnpm dev
```

### その他のコマンド

| コマンド | 説明 |
|---|---|
| `pnpm db:up` | DB のみ起動（デタッチモード） |
| `pnpm db:down` | DB を停止 |
| `pnpm db:migrate` | DB マイグレーション実行 |
| `pnpm lint` | リンター実行 |
| `pnpm format` | フォーマッター実行 |
| `pnpm typecheck` | 型チェック |
| `pnpm test` | テスト実行 |
| `pnpm build` | ビルド |
