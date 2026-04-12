import { readFile, writeFile, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_PATH = join(homedir(), ".tascalrc");

const DEFAULT_API_URL = "http://localhost:3000";

interface Config {
  token?: string;
  apiUrl?: string;
}

export async function readConfig(): Promise<Config> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(content) as Config;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

export async function writeConfig(config: Config): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
    encoding: "utf-8",
    mode: 0o600,
  });
}

export async function deleteConfig(): Promise<void> {
  try {
    await unlink(CONFIG_PATH);
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return;
    }
    throw err;
  }
}

export function getApiUrl(config: Config): string {
  return process.env.TASCAL_API_URL ?? config.apiUrl ?? DEFAULT_API_URL;
}
