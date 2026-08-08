# `@tascal/design-tokens`

Web と Mobile で意味と値を共有する semantic color token を管理する、プラットフォーム非依存の package です。

- `src/index.ts`: 唯一の手編集対象となる token 定義
- `theme.css`: Tailwind CSS v4 用の生成物（直接編集しない）
- `pnpm generate`: token 定義から `theme.css` を再生成

Web / Mobile 固有の theme mapping と固有色は、それぞれのアプリ側に残します。`pnpm build` と `pnpm test` は生成物が token 定義と一致しない場合に失敗します。
