# Mobile development

## React Native Storybook

Storybook 10.4+ の entry-point swapping を利用しています。Expo Router の
route は追加していません。`STORYBOOK_ENABLED=true` のときだけ Metro が
`.rnstorybook/index.ts` に entry point を差し替え、環境変数が未設定の通常起動・
production bundle では Storybook のコードを含めません。

repository root から次のいずれかを実行します。

```bash
pnpm --filter @tascal/mobile storybook
pnpm --filter @tascal/mobile storybook:ios
pnpm --filter @tascal/mobile storybook:android
```

Metro の設定変更後や story が見つからない場合は、`-- --clear` を末尾に付けて
cache を消して再起動してください。通常アプリは従来どおり `start`、`ios`、
`android` script で起動します。

### Story の追加

- `*.stories.tsx` を対象コンポーネントと同じ directory に置きます。
- Component Story Format (`Meta` / `StoryObj`) と args を使い、API 通信や認証に
  依存しない fixture で状態を再現します。
- 複数 story で共有する task は
  `components/storybook/task-fixtures.ts` の factory / fixture を利用します。
- light は既定です。dark story には
  `parameters: { colorScheme: "dark" }` を指定します。共通 decorator が端末の
  color scheme と canvas background、safe-area metrics を揃えます。

Storybook 設定を変更した場合は、通常の Mobile checks に加えて Storybook を
iOS または Android で起動し、対象 story を目視確認してください。
