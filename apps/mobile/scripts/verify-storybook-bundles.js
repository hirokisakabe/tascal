const { mkdtempSync, readFileSync, readdirSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const mobileRoot = path.resolve(__dirname, "..");
const expoCli = require.resolve("expo/bin/cli");
const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "tascal-storybook-verify-"),
);
const marker = Buffer.from("storybook-user");

function exportBundle(name, storybookEnabled) {
  const outputDirectory = path.join(temporaryRoot, name);
  const environment = {
    ...process.env,
    CI: "true",
    EXPO_HOME: path.join(temporaryRoot, "expo-home"),
    NODE_ENV: "production",
    STORYBOOK_DISABLE_TELEMETRY: "1",
  };

  if (storybookEnabled) {
    environment.STORYBOOK_ENABLED = "true";
  } else {
    delete environment.STORYBOOK_ENABLED;
  }

  const result = spawnSync(
    process.execPath,
    [expoCli, "export", "--platform", "ios", "--output-dir", outputDirectory],
    { cwd: mobileRoot, env: environment, stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error(`${name} iOS export failed with status ${result.status}`);
  }

  return outputDirectory;
}

function bundleContainsMarker(directory) {
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? bundleContainsMarker(entryPath)
      : readFileSync(entryPath).includes(marker);
  });
}

try {
  const normalBundle = exportBundle("normal", false);
  if (bundleContainsMarker(normalBundle)) {
    throw new Error("Normal production bundle contains a Storybook marker");
  }

  const storybookBundle = exportBundle("storybook", true);
  if (!bundleContainsMarker(storybookBundle)) {
    throw new Error("Storybook bundle does not contain the expected marker");
  }

  console.log("Storybook bundle isolation verified for production iOS export.");
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
