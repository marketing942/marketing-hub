import type { NextConfig } from "next";

// Host do Supabase (Storage) para liberar imagens de snapshot no next/image.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Fixa a raiz no diretório do projeto (havia outro lockfile em C:\Users\Cppem).
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
