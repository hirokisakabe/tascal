# tascal

[![CI](https://github.com/hirokisakabe/tascal/actions/workflows/ci.yml/badge.svg)](https://github.com/hirokisakabe/tascal/actions/workflows/ci.yml)

## ローカル開発

### 前提条件

- Node.js
- Docker

### セットアップ

```bash
make install
```

`.env.example` を参考に `apps/api/.env.local` を作成します。

```bash
cp .env.example apps/api/.env.local
# 必要に応じて値を編集
```

初回のみ DB マイグレーションを実行します。

```bash
make db-up
make db-migrate
make db-down
```

### 開発サーバーの起動

DB（PostgreSQL）・API・Web をまとめて起動します。`Ctrl+C` で全て停止します。

```bash
make dev
```

### その他のコマンド

| コマンド | 説明 |
|---|---|
| `make db-up` | DB のみ起動（デタッチモード） |
| `make db-down` | DB を停止 |
| `make db-migrate` | DB マイグレーション実行 |
| `make lint` | リンター実行 |
| `make format` | フォーマッター実行 |
| `make typecheck` | 型チェック |
| `make test` | テスト実行 |
| `make build` | ビルド |
