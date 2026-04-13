import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: () => "/mock-home",
}));

import { readFile, writeFile, unlink } from "node:fs/promises";
import { readConfig, writeConfig, deleteConfig, getApiUrl } from "./config.js";

const mockedReadFile = vi.mocked(readFile);
const mockedWriteFile = vi.mocked(writeFile);
const mockedUnlink = vi.mocked(unlink);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("readConfig", () => {
  it("ファイルが存在する場合、パースした設定を返す", async () => {
    mockedReadFile.mockResolvedValue(
      JSON.stringify({ token: "abc", apiUrl: "http://localhost:3000" }),
    );

    const config = await readConfig();

    expect(config).toEqual({ token: "abc", apiUrl: "http://localhost:3000" });
    expect(mockedReadFile).toHaveBeenCalledWith(
      "/mock-home/.tascalrc",
      "utf-8",
    );
  });

  it("ファイルが存在しない場合（ENOENT）、空オブジェクトを返す", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedReadFile.mockRejectedValue(err);

    const config = await readConfig();

    expect(config).toEqual({});
  });

  it("パースエラー時に例外をスローする", async () => {
    mockedReadFile.mockResolvedValue("invalid json");

    await expect(readConfig()).rejects.toThrow();
  });
});

describe("writeConfig", () => {
  it("JSON 形式で設定を書き出す（パーミッション 0o600）", async () => {
    mockedWriteFile.mockResolvedValue();

    await writeConfig({ token: "abc" });

    expect(mockedWriteFile).toHaveBeenCalledWith(
      "/mock-home/.tascalrc",
      JSON.stringify({ token: "abc" }, null, 2) + "\n",
      { encoding: "utf-8", mode: 0o600 },
    );
  });
});

describe("deleteConfig", () => {
  it("ファイルを削除する", async () => {
    mockedUnlink.mockResolvedValue();

    await deleteConfig();

    expect(mockedUnlink).toHaveBeenCalledWith("/mock-home/.tascalrc");
  });

  it("ファイルが存在しない場合（ENOENT）、エラーなくスキップする", async () => {
    const err = new Error("ENOENT") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockedUnlink.mockRejectedValue(err);

    await expect(deleteConfig()).resolves.toBeUndefined();
  });
});

describe("getApiUrl", () => {
  beforeEach(() => {
    delete process.env.TASCAL_API_URL;
  });

  it("環境変数が設定されている場合、環境変数の値を返す", () => {
    process.env.TASCAL_API_URL = "http://env-url";

    const url = getApiUrl({ apiUrl: "http://config-url" });

    expect(url).toBe("http://env-url");
  });

  it("環境変数がなく config.apiUrl がある場合、config の値を返す", () => {
    const url = getApiUrl({ apiUrl: "http://config-url" });

    expect(url).toBe("http://config-url");
  });

  it("環境変数も config.apiUrl もない場合、デフォルト URL を返す", () => {
    const url = getApiUrl({});

    expect(url).toBe("https://tascal.dev");
  });
});
