/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Lets next/image optimize Supabase Storage public URLs (character
    // avatars, campaign covers, handout previews). Update the hostname if
    // NEXT_PUBLIC_SUPABASE_URL ever points at a different project.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jwogywcghwvrovllyhbb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
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
