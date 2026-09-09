import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LUNAR-X | Interactive Lunar Surface Visualization",
  description:
    "Interactive 3D Lunar Surface Visualization & Analysis Platform. Explore selenographic coordinates, analyze OHRC & TMC-2 satellite imagery, and simulate real-time solar illumination.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-black text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
