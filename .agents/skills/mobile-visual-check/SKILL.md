---
name: mobile-visual-check
description: "tascal の Mobile UI を実装・変更・レビューしたときに、React Native Storybook と iOS Simulator で対象 story を選定し、light/dark・端末サイズ・関連状態を目視確認してスクリーンショット付きで報告する。apps/mobile のコンポーネント、画面、theme、design token、Liquid Glass など見た目に影響する変更では明示指定がなくても使用する。API、DB、CLI、テスト、型、ロジック、依存関係だけの非視覚的な変更では使用しない。Storybook の導入・upgrade 自体には使用しない。"
---

# Mobile visual check

tascal の Mobile UI 変更を、既存の React Native Storybook と iOS Simulator で
再現可能に目視確認する。setup、VRT、E2E、UI の自動修正は扱わない。

## 完了条件

次をすべて満たしたときだけ視覚確認を pass とする。

- diff から見た目に影響する変更と対応 story を説明できる
- 対象 story を iOS Simulator 上で実際に表示した
- light / dark、compact / standard の 2 サイズ、変更に関係する状態を確認した
- 各確認条件を識別できるスクリーンショットを保存した
- チェックリストを適用し、結果と残課題を所定の形式で報告した

一部しか実行できない場合は partial または blocked とする。コードを読んだだけで
目視確認を pass にしない。

## 1. Scope gate

まず依頼と diff を読み、この skill の対象か判定する。

対象になる例:

- `apps/mobile` の画面、visual component、style、asset、animation、safe area
- `apps/mobile/constants/theme.ts` や `packages/design-tokens` の見た目に関わる変更
- Liquid Glass など native 表現や fallback 表示の変更
- Mobile UI の PR review、見た目確認、スクリーンショット取得

対象外になる例:

- API、DB、Web、CLI だけの変更
- Mobile でも data fetching、認証、型、test、build 設定だけで見た目が変わらない変更
- Storybook の導入、設定移行、version upgrade（公式 setup skill / docs の領域）

対象外なら「非視覚的な変更のため mobile visual check は不要」と短く報告して終了する。
見た目への影響が不明なら、消極的に除外せず diff の consumer まで追跡する。

## 2. Diff から story を選ぶ

ユーザーが base / compare range を指定していればそれを優先する。指定がなければ
GitHub から default branch を解決し、working tree、staged diff、default branch
との branch diff を確認する。

```bash
git status --short
git diff --name-status
git diff --cached --name-status
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
git diff --name-status "origin/${DEFAULT_BRANCH}...HEAD"
```

各 visual change を次の順で story に対応付ける。

1. 変更 component と同じ directory の `*.stories.tsx` を探す。
2. import と render tree を `rg` で追い、変更 component を含む親 component の
   story を加える。
3. theme、design token、Storybook decorator、共有 surface の変更では、その値を
   import する story と representative な component story を加える。
4. rename / delete では旧参照が残っていないか確認し、置換先 story を選ぶ。
5. route 固有 UI など対応 story がなければ、関連 component story で確認できる範囲と
   coverage gap を分ける。未確認部分を pass にせず blocker として報告する。

選定結果を先に表へまとめる。

| Story                  | diff との関係                | 確認する状態      | Theme      | Device class      |
| ---------------------- | ---------------------------- | ----------------- | ---------- | ----------------- |
| `Components/... / ...` | 変更 component を直接 render | long / empty など | 関連 theme | 関連 device class |

## 3. 確認 matrix を作る

matrix 全体で compact / standard の両端末と light / dark の両 theme を含める。
折り返し、横幅、safe area に関係する state は両端末で、色、contrast、native material
に関係する state は両 theme で確認する。state と theme が相互作用する変更だけはその
組み合わせも確認する。全 state × 全 theme の直積を機械的に要求せず、diff の visual
concern を各条件で代表できる最小 matrix にする。

端末名を固定せず、`xcrun simctl list devices available` から利用可能な iPhone を選ぶ。

- compact: 利用可能な中で画面幅または高さが小さい iPhone
- standard: 日常開発で使う現行相当の標準的な iPhone

実際の model、iOS runtime、向き、必要なら viewport を報告する。iPad や landscape
への影響が diff から予想される場合だけ追加する。

状態は変更に関係するものを選ぶ。最低限、該当する既存 story の `Empty`、
`MultipleTasks`、`LongTitle`、通常状態を確認する。必要な state / theme の組み合わせを
fixture や Controls で再現できず、対応 story もなければ coverage blocker とする。
この視覚確認の途中で UI を勝手に修正したり、scope 外の story を追加したりしない。

`.rnstorybook/preview.tsx` の safe-area `initialMetrics` は 390×844 に固定されている。
compact / standard の実画面幅による折り返しや配置は比較できるが、端末固有の safe-area
insets は比較できない。safe area が変更対象ならこの制約を Remaining issues に記録し、
Storybook だけで検証済みにしない。

## 4. Simulator と Storybook を起動する

repository root で前提を確認する。

```bash
command -v xcrun
xcrun simctl list devices available
test -f apps/mobile/.rnstorybook/index.ts
```

compact と standard の device identifier を記録する。対象 Simulator を boot し、
boot 完了を待ってから tascal の script で Storybook を起動する。

```bash
open -a Simulator
xcrun simctl boot <DEVICE_UDID> 2>/dev/null || true
xcrun simctl bootstatus <DEVICE_UDID> -b
pnpm --filter @tascal/mobile storybook:ios
```

`storybook:ios` は `STORYBOOK_ENABLED=true` を設定し、Metro の entry-point swapping
で `.rnstorybook/index.ts` を表示する。通常アプリの `ios` script で代用しない。
Metro cache が原因で story が見つからない場合は、既存 process を止めてから
`pnpm --filter @tascal/mobile storybook --clear` を試す。

`storybook:ios` の実体である `expo start --ios` には UDID 指定がない。Simulator UI で
対象 device を active にしてから起動し、Storybook が matrix の UDID / model に表示された
ことを Simulator window と `xcrun simctl list devices` の両方で確認する。複数 Simulator
が boot 済みで対象を確定できない場合は、別端末の証拠で続けず blocker とする。

## 5. Story を表示して証拠を取る

Storybook の on-device navigator を開き、Step 2 の `title` と named export に対応する
story を選ぶ。UI 操作 tool が使えるなら story explorer の検索、選択、fullscreen
切り替えを操作する。自動操作が使えない場合は、ユーザーへ選択だけを依頼し、表示中の
story 名を画面で再確認してから続ける。

tascal では light が既定で、dark story は
`parameters: { colorScheme: "dark" }` により共通 decorator が theme、background、
safe-area metrics を揃える。名前だけで theme を推測せず story 定義を確認する。

各 matrix 行で Storybook controls を閉じ、story canvas が読める状態にしてから保存する。
スクリーンショットは repo 外の一時 directory に置き、ファイル名に story、state、theme、
device class を含める。

```bash
ARTIFACT_DIR="/tmp/tascal-mobile-visual-check-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARTIFACT_DIR"
xcrun simctl io <DEVICE_UDID> screenshot \
  "$ARTIFACT_DIR/<story>-<state>-<theme>-<device-class>.png"
```

取得直後に画像を開いて、誤った story、loading / error overlay、Storybook navigator の
被り、空の screenshot でないことを確認する。

## 6. 視覚チェックリスト

各 screenshot と実機表示に次を適用する。

- layout: alignment、spacing、safe area、画面端、bottom sheet 高さが意図どおりか
- clipping: 長文、badge、button、scroll content が切れたり不自然に省略されないか
- overlap: text、icon、sheet、keyboard / system UI が重なっていないか
- contrast: light / dark の text、icon、surface、disabled state が判別できるか
- state: empty、複数件、長文など変更に関係する差が正しく表現されるか
- native: Liquid Glass、blur、shadow、corner、system symbol が対応 runtime で native
  らしく見えるか。fallback が変更対象なら fallback runtime / 条件も別に確認する
- consistency: `apps/mobile/constants/theme.ts` と `@tascal/design-tokens` に沿い、
  Web の見た目をそのまま模倣していないか

主観的な違和感は断定せず、story / screenshot / 観察事実を添える。

Liquid Glass が対象なら、対応する iOS runtime で「設定 > アクセシビリティ > 画面表示と
テキストサイズ > 透明度を下げる」を off にして native glass を、on にして不透明な
fallback surface を確認する。切り替え後は story を再選択し、`SheetSurface` の実装が
参照する accessibility state を更新させる。利用可能なら非対応 runtime の fallback も
追加する。対応 runtime がなく native 表現を再現できない場合は未確認条件として報告する。

## 7. Tool fallback と blocker

次の順で fallback する。

1. Simulator の UI 操作 tool がない: ユーザーに story 選択と theme 切り替えを依頼し、
   `xcrun simctl io` で agent が screenshot を取得する。
2. `xcrun simctl io ... screenshot` が使えない: UI 操作 tool の screenshot、または
   ユーザー提供画像を使い、取得方法を報告する。
3. Simulator / Xcode runtime / Storybook 起動 / UI 操作 / screenshot のいずれも代替
   できない: static review で判明した対象と matrix だけを報告し、status を blocked にする。
4. 対応 story や必要状態がない: coverage gap を blocker にする。無関係な story の画像で
   代用しない。

fallback でも story、device、theme を証拠から識別できることが必要。証拠なしに pass を
宣言しない。

- `pass`: 全 matrix に証拠があり、未解決 finding / blocker がない
- `partial`: 対象 UI の証拠は一部取得できたが、matrix の一部または再現条件が未確認
- `blocked`: 対象 UI を示す信頼できる screenshot がない、Storybook を起動できない、
  または変更の中心を表す story / state がない

## 8. 報告形式

```markdown
## Mobile visual check

- Status: pass | partial | blocked
- Diff: <比較範囲または対象変更>
- Storybook: <起動 command と結果>
- Artifacts: <screenshot directory / 添付>

| Story / state              | Device (runtime)        | Theme | Result                 | Evidence           |
| -------------------------- | ----------------------- | ----- | ---------------------- | ------------------ |
| Components/... / LongTitle | compact model (iOS ...) | dark  | pass / issue / blocked | path or attachment |

### Findings

- [severity] <layout / clipping / overlap / contrast / state / native の観察事実>

### Remaining issues

- <coverage gap、未確認 matrix、tool blocker。なければ「なし」>
```

`Status: pass` は matrix の全行に証拠があり、重大な finding と blocker がない場合だけ使う。
共有可能な review / PR が成果物なら、利用可能な添付機能で screenshot を共有し、Evidence
から参照できるようにする。依頼がなければ screenshot を repository に commit せず、添付
できない環境では一時 path と共有 blocker を報告する。

## 参考資料

- [OpenAI: Build skills](https://developers.openai.com/codex/skills)
- [React Native Storybook: Getting started](https://storybookjs.github.io/react-native/docs/intro/getting-started/)
- [React Native Storybook: Writing stories](https://storybookjs.github.io/react-native/docs/intro/writing-stories/)
- [React Native Storybook: Storybook UI configuration](https://storybookjs.github.io/react-native/docs/intro/configuration/storybook-ui-configuration/)
- [Expo: GlassEffect](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- [`apps/mobile/README.md`](../../../apps/mobile/README.md)
