/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid bundling poker-odds-calc (causes webpack chunk resolution errors like ./276.js)
  experimental: {
    serverComponentsExternalPackages: ["poker-odds-calc"],
  },
  // Fix EMFILE "too many open files" on macOS - use polling instead of native watchers
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

export default nextConfig;
