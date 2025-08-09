import type { Metadata } from "next";
import { ThemeProvider } from "@/components/contexts/theme-provider";
import { Navbar } from "@/components/navbar";
import { Space_Mono, Space_Grotesk } from "next/font/google";
import "@/styles/globals.css";

const sansFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
  weight: "400",
});

const monoFont = Space_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Mesa - High-performance React state management",
  metadataBase: new URL("https://mesa-docs.vercel.app/"),
  description:
    "Mesa provides fine-grained reactivity for React applications with automatic dependency tracking and path-based subscriptions. Zero dependencies, minimal bundle size, maximum performance.",
  keywords: ["React", "state management", "fine-grained reactivity", "performance", "TypeScript"],
  authors: [{ name: "Mesa Team" }],
  openGraph: {
    title: "Mesa - High-performance React state management",
    description: "Fine-grained reactivity for React with automatic dependency tracking",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mesa - High-performance React state management",
    description: "Fine-grained reactivity for React with automatic dependency tracking",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
        />
      </head>
      <body
        className={`${sansFont.variable} ${monoFont.variable} font-regular antialiased tracking-wide`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="mx-auto h-auto scroll-smooth">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
