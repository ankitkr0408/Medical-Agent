import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Medical Agent — AI-Powered Medical Image Analysis",
  description:
    "Upload medical images, get instant AI analysis with multi-specialist consultation, and generate comprehensive reports. Powered by GPT-4 Vision and MongoDB Atlas.",
  keywords: [
    "medical AI",
    "image analysis",
    "GPT-4 Vision",
    "DICOM viewer",
    "medical imaging",
    "AI diagnosis",
    "multi-doctor consultation",
    "radiology AI",
    "healthcare AI",
    "medical reports",
  ],
  openGraph: {
    title: "Medical Agent — AI-Powered Medical Image Analysis",
    description:
      "Upload medical images, get instant AI analysis with multi-specialist consultation, and generate comprehensive reports.",
    type: "website",
    siteName: "Medical Agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medical Agent — AI-Powered Medical Image Analysis",
    description:
      "Upload medical images, get instant AI analysis with multi-specialist consultation, and generate comprehensive reports.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#030712" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
