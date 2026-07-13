/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Don't reuse client-cached RSC payloads for dynamic pages. Workspace
    // content (notes, inventory) changes between navigations — with the
    // default 30s reuse, switching notes and back replays the payload from
    // before the last save (e.g. an empty just-created note).
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
