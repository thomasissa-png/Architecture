import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // BR-6 (session 38) : react-image-crop v11 ships strict ESM (`type: module`)
  // qui peut poser problème au resolver webpack de Next.js dans certains
  // environnements de build (Replit avec node_modules cachéé). Whitelister
  // le package dans transpilePackages le force à passer par la transpilation
  // SWC de Next.js, qui gère ESM correctement quel que soit le contexte.
  transpilePackages: ["react-image-crop"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  disableSourceMapUpload: true,
});
