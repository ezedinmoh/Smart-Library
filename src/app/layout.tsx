import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL("https://smart-library-et.vercel.app"),
  title: {
    default: "Smart Library Management System",
    template: "%s - Smart Library",
  },
  description:
    "Access thousands of books, manage your reading journey, and connect with a community of passionate readers.",
  openGraph: {
    title: "Smart Library Management System",
    description: "Access thousands of books and manage your reading journey.",
    url: "https://smart-library-et.vercel.app",
    siteName: "Smart Library",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Theme init — before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
