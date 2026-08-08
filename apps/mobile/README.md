# Mobile

## テスト配置

テストは原則として、対象コードと同じディレクトリにコロケーションします。
たとえば、`components/example.tsx` のテストは
`components/example.test.tsx` に配置します。

Expo Router の route コンポーネントは例外です。`app/` 配下のファイルは route
または layout として扱われるため、route テストを `app/` 配下には置かず、
`__tests__/routes/` に配置します。

参考: [Testing configuration for Expo Router](https://docs.expo.dev/router/reference/testing/)
