import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Performance optimizations
  poweredByHeader: false,

  experimental: {
    // Reduce client bundle size for icon-heavy components (tree-shaking isn't always enough).
    optimizePackageImports: ["lucide-react"],
  },
  
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
