/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // googleapis is an optional runtime dependency — don't bundle it, require at runtime if available
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "googleapis",
      ];
    }
    return config;
  },
};

export default nextConfig;
