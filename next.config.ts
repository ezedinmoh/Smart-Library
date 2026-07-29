import type { NextConfig } from "next";

// Content Security Policy — allows Stripe, Cloudinary, Google Fonts, and local dev
// Only applied to HTML pages (not _next/static assets) to avoid MIME type conflicts
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://js.stripe.com https://m.stripe.network https://*.stripecdn.com https://b.stripecdn.com https://cdn.jsdelivr.net https://*.hcaptcha.com https://hcaptcha.com https://newassets.hcaptcha.com https://*.chapa.co https://checkout.chapa.co blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://*.hcaptcha.com https://hcaptcha.com https://*.stripe.com https://*.stripecdn.com",
  "font-src 'self' data: https://fonts.gstatic.com https://js.stripe.com https://m.stripe.network https://cdn.jsdelivr.net https://*.stripecdn.com https://*.stripe.com",
  "img-src 'self' data: blob: https://res.cloudinary.com http://localhost:* https:",
  "connect-src 'self' https://api.stripe.com https://*.stripe.com https://*.stripecdn.com https://api.chapa.co https://checkout.chapa.co https://*.chapa.co https://*.hcaptcha.com https://hcaptcha.com https://m.stripe.network https://js.stripe.com https://api.cloudinary.com https://res.cloudinary.com wss://m.stripe.network ws://localhost:* http://localhost:* https://*.supabase.co",
  "frame-src 'self' https://docs.google.com https://*.stripe.com https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://checkout.chapa.co https://*.chapa.co https://*.hcaptcha.com https://hcaptcha.com https://res.cloudinary.com",
  "worker-src 'self' blob: https://*.stripecdn.com https://*.stripe.com https://*.hcaptcha.com",
  "child-src 'self' blob: https://*.stripecdn.com https://*.stripe.com https://*.hcaptcha.com",
  "object-src 'self' https://res.cloudinary.com",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "http", hostname: "localhost", pathname: "/**" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Apply CSP only to actual pages — NOT to _next/static assets
        // (nosniff on static chunks causes CSS/JS MIME type errors in dev)
        source: "/((?!_next/static|_next/image|favicon).*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
    serverMinification: false,
  },
};

export default nextConfig;
