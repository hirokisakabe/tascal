/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/list",
        permanent: true,
      },
    ];
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
