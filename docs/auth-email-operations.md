# 認証メール運用

tascal は Resend を利用して、メールアドレス確認とパスワード再設定のトランザクションメールを送信する。

## 本番設定

- `RESEND_API_KEY`: Resend の送信 API キー。Google Secret Manager に保存し、Cloud Run の secret environment variable として渡す。GitHub Actions やリポジトリへ平文で保存しない。
- `EMAIL_FROM_ADDRESS`: Resend で検証済みのドメインに属する送信元アドレス。
- `EMAIL_FROM_NAME`: メールクライアントに表示する送信元名。
- `EMAIL_SEND_TIMEOUT_MS`: Resend が配送要求を受け付けたことを待つ上限。既定値は 3000 ms。
- `PASSWORD_RESET_MIN_RESPONSE_MS`: 登録済み・未登録アドレスの処理時間差を抑える応答時間の下限。`EMAIL_SEND_TIMEOUT_MS` 以上にする。既定値は 3000 ms。

Secret Manager から Cloud Run へ渡す例:

```bash
gcloud run services update tascal \
  --region asia-northeast1 \
  --set-secrets RESEND_API_KEY=tascal-resend-api-key:latest \
  --update-env-vars EMAIL_FROM_ADDRESS=no-reply@example.com,EMAIL_FROM_NAME=tascal
```

## Preview 環境

PR preview には `RESEND_API_KEY`、送信元アドレス、送信元名を渡さない。未レビューコードが送信資格情報や任意宛先への送信能力を取得することを防ぐためである。Preview 上の認証メール配送は動作対象外とし、UI・API の自動テストでは差し替え可能なテスト sender を使用して外部メールを送信しない。

実配送は、レビュー済みコードを本番相当の隔離環境へ反映した後、Resend の検証済みテスト宛先で次を確認する。

1. 新規登録の確認メールを受信し、リンクが 1 時間で期限切れになることを確認する。
2. パスワード再設定メールを受信し、使用後に同じリンクを再利用できないことを確認する。
3. Resend の送信履歴と Cloud Run の構造化ログを request ID で突き合わせる。ログには宛先、token、API key、provider response body を記録しない。

## 障害時

配送失敗ログは `purpose`、`failureType`、`requestId` のみを含む。`failureType` は `configuration`、`rejected`、`timeout`、`unreachable`、`unknown` のいずれかである。利用者には provider 詳細を返さず、確認メールでは再試行を案内し、パスワード再設定要求では登録有無・配送結果にかかわらず同じ案内を返す。
