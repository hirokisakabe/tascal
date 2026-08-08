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

Metro の設定変更後や story が見つからない場合は、たとえば
`pnpm --filter @tascal/mobile storybook --clear` で cache を消して再起動して
ください。通常アプリは従来どおり `start`、`ios`、
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

`pnpm --filter @tascal/mobile storybook:verify` は通常 production bundle と
Storybook bundle をそれぞれ iOS 向けに export し、story marker が前者にはなく
後者にだけ含まれることを検証します。

### Agent による見た目確認

Mobile UI の実装・変更・レビュー時は repo-scoped の
[`mobile-visual-check`](../../.agents/skills/mobile-visual-check/SKILL.md) skill を使います。
変更 diff から対象 story を選び、iOS Simulator で light / dark、compact / standard
端末、長文・empty・複数件など変更に関係する状態を確認し、スクリーンショット付きの
定型レポートを作成します。API、hook、型、test、依存更新だけの非視覚的な変更では
使用しません。

Codex では Mobile UI の依頼内容に合えば自動選択されます。明示する場合は prompt で
`$mobile-visual-check` を指定してください。Simulator 操作や screenshot 取得ができない
環境では、skill の fallback に従い partial / blocked と未確認条件を報告します。

skill の形式と配置は [OpenAI の skills documentation](https://developers.openai.com/codex/skills)、
Storybook の起動・story 定義は
[React Native Storybook documentation](https://storybookjs.github.io/react-native/docs/intro/getting-started/)
に準拠しています。
