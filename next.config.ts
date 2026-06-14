import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // reactCompiler is OFF: it's an experimental Babel pass that runs only on
  // `next build` (not under Turbopack dev), so prod and dev diverged — the
  // optimized build broke client event handlers (e.g. the mobile menu toggle)
  // while localhost looked fine. Re-enable only after verifying interactivity
  // in a real `next start` build.
  reactCompiler: false,
};

export default withNextIntl(nextConfig);
