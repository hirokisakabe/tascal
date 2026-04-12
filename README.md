<div align="center">

# tascal

### タスク管理を、カレンダーから。

シンプルなカレンダー UI でタスクを俯瞰・整理できる、オープンソースのタスク管理アプリ

[Web アプリを使う](https://tascal.dev/) | [CLI (npm)](https://www.npmjs.com/package/tascal-cli)

[![CI](https://github.com/hirokisakabe/tascal/actions/workflows/ci.yml/badge.svg)](https://github.com/hirokisakabe/tascal/actions/workflows/ci.yml)

</div>

<br />

<div align="center">

![tascal — カレンダービューでタスクを管理](apps/web/public/screenshot.png)

</div>

<br />

## tascal でできること

**月間カレンダーでタスクを一望** — 今月やるべきことをカレンダー上でひと目で把握。月の切り替えや「今日に戻る」で素早く移動できます。

**日付をクリックしてすぐ作成** — カレンダーの日付をクリックするだけでタスクを追加。タイトル・説明・日付をあとから編集することもできます。

**ドラッグ&ドロップでスケジュール調整** — 予定が変わったら、タスクをつかんで別の日にドロップするだけ。

**完了をチェックで管理** — チェックボックスひとつでタスクの完了/未完了を切り替え。完了タスクには取り消し線が入り、視覚的に区別できます。

**CLI からも操作可能** — ターミナル派のために、CLI ツールも用意しています。ブラウザを開かずにタスクの追加・編集・完了操作ができます。

## はじめる

### Web アプリ

[tascal.dev](https://tascal.dev/) にアクセスしてアカウントを作成するだけで、すぐに使い始められます。

### CLI

```bash
npm install -g tascal-cli
```

```bash
tascal login          # ログイン
tascal logout         # ログアウト
tascal list           # タスク一覧
tascal add            # タスク作成
tascal edit <id>      # 編集
tascal done <id>      # 完了にする
tascal undo <id>      # 未完了に戻す
tascal delete <id>    # 削除
```

## セルフホスト

tascal はオープンソースなので、自分のサーバーで動かすこともできます。

```bash
git clone https://github.com/hirokisakabe/tascal.git
cd tascal
pnpm install
cp apps/api/.env.example apps/api/.env  # 環境変数を設定
pnpm dev                                # DB + API + Web を起動
```

詳しいセットアップ手順や環境変数の説明は [CLAUDE.md](./CLAUDE.md) を参照してください。

## Tech Stack

React, Hono, PostgreSQL, Drizzle ORM, Tailwind CSS, TanStack Router, dnd-kit, better-auth, Vitest — pnpm workspaces によるモノレポ構成で、Docker + Google Cloud Run にデプロイしています。

## Contributing

Issue や Pull Request はいつでも歓迎です。バグ報告・機能提案・ドキュメント改善など、どんな貢献でもお気軽にどうぞ。
