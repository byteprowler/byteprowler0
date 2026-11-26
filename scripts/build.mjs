import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const forceNextOnly = process.argv.includes("--next-only");
const isCloudflareWorkersCI =
  !forceNextOnly &&
  (process.env.WORKERS_CI === "1" || process.env.OPENNEXT_CLOUDFLARE_BUILD === "1");

if (isCloudflareWorkersCI) {
  const pkgRoot = dirname(require.resolve("@opennextjs/cloudflare/package.json"));
  const openNextCli = join(pkgRoot, "dist", "cli", "index.js");
  execFileSync(process.execPath, [openNextCli, "build"], {
    stdio: "inherit",
    env: process.env,
  });
} else {
  const nextBin = require.resolve("next/dist/bin/next");
  execFileSync(process.execPath, [nextBin, "build"], {
    stdio: "inherit",
    env: process.env,
  });
}
