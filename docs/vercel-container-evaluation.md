# Vercel custom container 評価

評価日: 2026-07-25

## 結論

現時点では **Cloud Run 継続**を推奨する。

tascal の単一 container は `Dockerfile.vercel` への小さな差分だけで Vercel
Container Images に載せられる。一方、API と SPA が同じ origin で動く既存構成では
Vercel Services に分割する利点は小さく、Cloud Run から移すことで新たに得られる機能より、
Function の実行時間・メモリ・ネットワーク制約、preview URL ごとの auth 設定、
CLI/mobile の API URL 管理が増える影響の方が大きい。

Vercel の immutable preview URL と Git 連携が必要になった場合は、まず
**Web preview のみ Vercel、production API / static serving は Cloud Run**
というハイブリッド構成を別 issue で検証する。production の全面移行は、
container image 機能の運用実績が蓄積し、Cloud Run と比較した実測コストが有利になってから
再評価する。

## 試験設定

リポジトリ直下の [`Dockerfile.vercel`](../Dockerfile.vercel) を使う。
Vercel はこのファイルを自動検出し、全リクエストを container function にルーティングするため、
単一 container 構成では `vercel.json` や Services 設定は不要。

既存 `Dockerfile` との差分は runtime の port のみ。

- Cloud Run: image 内の既定値として `PORT=8080`
- Vercel: platform が注入する `PORT` を使用（未指定時は `80`）

ローカル確認:

```bash
docker build -f Dockerfile.vercel -t tascal-vercel-eval .
docker run --rm -p 8080:80 \
  --env-file apps/api/.env \
  -e PORT=80 \
  tascal-vercel-eval
curl http://localhost:8080/healthz
```

Vercel CLI での試験 deploy:

```bash
npx vercel@latest link
npx vercel@latest env add DATABASE_URL preview
npx vercel@latest env add BETTER_AUTH_SECRET preview
npx vercel@latest env add BETTER_AUTH_URL preview
npx vercel@latest env add TRUSTED_ORIGINS preview
npx vercel@latest env add CORS_ORIGIN preview
npx vercel@latest deploy
```

`BETTER_AUTH_URL`、`TRUSTED_ORIGINS`、`CORS_ORIGIN` には同じ preview URL を設定する。
Vercel が deploy ごとに生成する URL は変わるため、継続的な preview 運用では
固定 alias または preview 用 custom domain を用意し、その origin を環境変数へ設定する。

## 環境変数と接続

| 変数                 | Preview での設定                                        | 理由                                                     |
| -------------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`       | Neon の preview 専用 branch の pooled connection string | 短時間に instance が増えても接続数を抑える               |
| `BETTER_AUTH_SECRET` | Vercel の encrypted environment variable                | Cloud Run と同じ secret を使う場合も平文で commit しない |
| `BETTER_AUTH_URL`    | 固定した HTTPS preview origin                           | auth endpoint と cookie の基準 URL                       |
| `TRUSTED_ORIGINS`    | Web の preview origin。複数ならカンマ区切り             | better-auth の origin 検証                               |
| `CORS_ORIGIN`        | Web と API が同一 origin なら同じ preview origin        | cookie を伴う API request を許可                         |
| `LOG_LEVEL`          | `info`                                                  | runtime logs の量を抑える                                |

現在の Web/API は同一 container・同一 origin なので cookie domain の明示設定は不要。
ホスト専用 cookie のまま preview URL ごとに分離される。production の `tascal.dev`
cookie は preview URL へ送信されない。

migration は container 起動時に実行しない。deploy 前に `DATABASE_URL` を指定して
`pnpm db:migrate` を一度実行し、複数 instance からの重複実行を避ける。
`GET /healthz` は Neon に `SELECT 1` を実行するため、起動確認と DB 疎通確認を兼ねる。

CLI は `TASCAL_API_URL=<preview URL>` で接続先を、`TASCAL_CONFIG_PATH=<一時ファイル>`
で token の保存先を切り替える。これにより `~/.tascalrc` の production URL と token を
変更せずに試験できる。mobile は今回のスコープ外だが、全面移行時には同様に API base URL の
切り替えが必要。

## 動作確認

試験 URL: デプロイ後に記録する

### Web

- [ ] ログイン
- [ ] タスク作成
- [ ] タスク更新
- [ ] タスク削除

### CLI

production 用 `~/.tascalrc` を上書きしないよう、試験用の一時設定ファイルで実行する。

```bash
export TASCAL_API_URL=<preview URL>
export TASCAL_CONFIG_PATH=/tmp/tascal-vercel-preview.json
tascal-cli login
tascal-cli list
tascal-cli add
```

- [ ] ログイン
- [ ] タスク一覧
- [ ] タスク作成

### 運用確認

- [ ] `GET /healthz` が `200 {"status":"ok"}` を返す
- [ ] Vercel runtime logs で起動・API request log を確認できる
- [ ] preview が scale-to-zero した後の初回応答時間を計測する

## Cloud Run との比較

| 観点          | Vercel custom container                                                  | Cloud Run                                                   | 評価                                                |
| ------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| deploy        | `Dockerfile.vercel` を自動 build・VCR 保存・preview URL 発行             | Artifact Registry build と service deploy                   | Preview UX は Vercel が有利                         |
| scale-to-zero | Preview は無通信 30 秒、production は 5 分で scale down                  | min instances 0 で scale-to-zero                            | 両方可能。Vercel preview は cold start が起きやすい |
| 実行時間      | Hobby 300 秒、Pro/Enterprise は既定 300 秒・通常最大 800 秒              | 既定 300 秒、最大 3,600 秒                                  | tascal CRUD には十分だが Cloud Run が柔軟           |
| memory/CPU    | Hobby 2 GB/1 vCPU、Pro/Enterprise 最大 4 GB/2 vCPU                       | service 設定でより広く選択可能                              | 現状は足りるが Vercel の上限が低い                  |
| image         | VCR は圧縮後合計 15 GB、単一 layer 500 MB                                | Artifact Registry / Cloud Run の image 制限                 | 現在の image は VCR 内に収まる                      |
| network       | custom image は Secure Compute / Static IP 未対応                        | VPC、固定 egress 等を構成可能                               | 将来の接続制御は Cloud Run が有利                   |
| logs          | stdout/stderr と Observability。保持は plan 依存                         | Cloud Logging、metrics、alerting                            | 既存運用を維持できる Cloud Run が有利               |
| pricing       | Active CPU、provisioned memory、invocation、origin transfer、VCR storage | vCPU、memory、request、network。request-based free tierあり | 実トラフィックでの比較が必要                        |
| auth/origin   | deploy URL 変化に合わせ trusted origin の運用が必要                      | `tascal.dev` の固定 origin                                  | Cloud Run が単純                                    |
| CLI/mobile    | preview の API URL を別管理                                              | production URL を継続利用                                   | Cloud Run が単純                                    |

## 実測値

ローカル build（Apple Silicon、Docker）:

- build 成功
- runtime image: 426,301,468 bytes（uncompressed、arm64）

Vercel の VCR 上限は圧縮 layer 単体 500 MB、圧縮後 image 合計 15 GB。
実 deploy では Vercel が build する `linux/amd64` / `linux/arm64` image の size を
Images 画面でも確認する。

## 公式資料

- [Container Images](https://vercel.com/docs/functions/container-images)
- [Vercel Container Registry limits and pricing](https://vercel.com/docs/container-registry/limits-and-pricing)
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations)
- [Fluid compute pricing](https://vercel.com/docs/functions/usage-and-pricing)
- [Vercel Services](https://vercel.com/docs/services)
- [Vercel Services pricing and limits](https://vercel.com/docs/services/pricing)
- [Cloud Run request timeout](https://docs.cloud.google.com/run/docs/configuring/request-timeout)
- [Cloud Run pricing](https://cloud.google.com/run/pricing)
