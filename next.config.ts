/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { staleTimes: { dynamic: 30 } },
  serverExternalPackages: ["@node-rs/argon2"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      {
        protocol: "https",
        hostname: "uploadthing-prod.s3.us-west-2.amazonaws.com",
      },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
  rewrites: () => {
    return [{ source: "/hashtag/:tag", destination: "/search?q=%23:tag" }];
  },
};

export default nextConfig;
