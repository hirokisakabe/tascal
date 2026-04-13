# tascal-cli

## 0.2.0

### Minor Changes

- 9f86d1f: CLI にカテゴリ管理コマンドとタスクコマンドのカテゴリ対応を追加

## 0.1.3

### Patch Changes

- fa5b475: CLI login で Origin ヘッダーを付与し、better-auth の CSRF 保護による 403 エラーを修正。エラー時のログにステータスコードとレスポンスボディを含めるよう改善。

## 0.1.2

### Patch Changes

- fcd13f2: fix: デフォルト API URL を https://tascal.dev に変更
- 83ab75d: fix: readPassword が特殊文字を正しく読み取れないバグを修正
- 7b700f1: fix: bin から "tascal" エントリを削除し "tascal-cli" のみに統一

## 0.1.1

### Patch Changes

- 9fa5246: bin フィールドに tascal-cli エントリを追加し、npx tascal-cli での実行を可能にした
