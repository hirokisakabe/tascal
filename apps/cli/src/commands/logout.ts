import { defineCommand } from "citty";
import { consola } from "consola";
import { readConfig, deleteConfig, getApiUrl } from "../config.js";

export default defineCommand({
  meta: {
    name: "logout",
    description: "保存されたトークンを削除してログアウトする",
  },
  async run() {
    const config = await readConfig();

    if (config.token) {
      const apiUrl = getApiUrl(config);
      try {
        await fetch(`${apiUrl}/api/auth/sign-out`, {
          method: "POST",
          headers: { Authorization: `Bearer ${config.token}` },
        });
      } catch {
        // サーバーに到達できない場合でもローカルのトークンは削除する
      }
    }

    await deleteConfig();
    consola.success("ログアウトしました。");
  },
});
