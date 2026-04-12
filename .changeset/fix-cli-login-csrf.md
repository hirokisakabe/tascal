---
"tascal-cli": patch
---

CLI login で Origin ヘッダーを付与し、better-auth の CSRF 保護による 403 エラーを修正。エラー時のログにステータスコードとレスポンスボディを含めるよう改善。
