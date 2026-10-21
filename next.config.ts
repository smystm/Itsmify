import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Prisma's engine must be loaded by Node at runtime, not bundled.
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    // Pin the workspace to this project. Without it Turbopack walks up to the
    // enclosing folder (which is not a Git repo) and warns about an unrelated
    // package-lock.json there.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
