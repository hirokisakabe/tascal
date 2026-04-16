# tascal-cli

[tascal](https://github.com/hirokisakabe/tascal) の CLI ツール — シンプルなカレンダー UI でタスクを俯瞰・整理できるタスク管理アプリ。

## インストール

```bash
npm install -g tascal-cli
```

## 使い方

```bash
# tascal にログイン
tascal-cli login

# タスク一覧を表示
tascal-cli list
tascal-cli list --month 4 --year 2026

# タスクを追加
tascal-cli add --title "牛乳を買う" --date 2026-04-12
tascal-cli add --title "ミーティング" --date 2026-04-13 --category <category-id>

# タスクを編集
tascal-cli edit <id> --title "オーツミルクを買う"
tascal-cli edit <id> --category <category-id>

# 完了 / 未完了にする
tascal-cli done <id>
tascal-cli undo <id>

# タスクを削除
tascal-cli delete <id>

# カテゴリを管理
tascal-cli category list
tascal-cli category add --name "仕事" --color blue
tascal-cli category edit <id> --name "プライベート" --color green
tascal-cli category delete <id>

# ログアウト
tascal-cli logout
```

## コマンド

| コマンド   | 説明                                     |
| ---------- | ---------------------------------------- |
| `login`    | tascal アカウントで認証する              |
| `logout`   | 保存された認証情報を削除する             |
| `list`     | 指定した月のタスク一覧を表示する         |
| `add`      | 新しいタスクを作成する                   |
| `edit`     | 既存のタスクを更新する                   |
| `done`     | タスクを完了にする                       |
| `undo`     | タスクを未完了に戻す                     |
| `delete`   | タスクを削除する                         |
| `category` | カテゴリを管理する (一覧/追加/編集/削除) |

## ライセンス

MIT
