import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
  // Configure R2 incremental cache here if an R2 bucket is provisioned later.
});

// Invoke Next.js directly so `bun run build` on Cloudflare Workers CI never recurses into OpenNext.
config.buildCommand = "node scripts/build.mjs --next-only";

export default config;
