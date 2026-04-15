// API のベース URL
// 開発時は Expo Go から Mac のローカルサーバーに接続する
// 本番時はデプロイ先の URL に変更する
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
