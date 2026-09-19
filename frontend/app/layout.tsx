import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/context/SettingsContext";
import NextTopLoader from 'nextjs-toploader';
import AppShell from "@/components/AppShell";
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, generateWebSiteJsonLd } from "@/utils/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Blog Chuyên Sâu Về Backend, DevOps & Hệ Thống`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "Backend Development",
    "DevOps",
    "PostgreSQL",
    "Redis",
    "Docker",
    "Kubernetes",
    "Golang",
    "NodeJS",
    "Next.js",
    "System Design",
    "Kinh nghiệm lập trình",
    "Tối ưu hóa cơ sở dữ liệu",
    "GET TIPS 200 OK",
  ],
  authors: [{ name: "GET TIPS 200 OK", url: SITE_URL }],
  creator: "GET TIPS 200 OK",
  publisher: "GET TIPS 200 OK",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    title: `${SITE_NAME} | Blog Chuyên Sâu Về Backend, DevOps & Hệ Thống`,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Tech Blog`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Blog Chuyên Sâu Về Backend, DevOps & Hệ Thống`,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/og-default.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = generateWebSiteJsonLd();

  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-[#101010] text-gray-900 dark:text-gray-200 transition-colors duration-300`}>
        <NextTopLoader color="#3b82f6" height={3} showSpinner={false} />
        <SettingsProvider>
          <AppShell>
            {children}
          </AppShell>
        </SettingsProvider>
      </body>
    </html>
  );
}
