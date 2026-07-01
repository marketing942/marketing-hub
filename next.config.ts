import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Fixa a raiz no diretório do projeto (havia outro lockfile em C:\Users\Cppem).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
