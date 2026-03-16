import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from inferring the monorepo/workspace root incorrectly
    // when multiple lockfiles exist. This keeps module resolution inside `frontend/`.
    root: __dirname,
  },
};

export default nextConfig;
