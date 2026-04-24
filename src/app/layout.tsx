import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import InteractiveIcons from "@/components/shared/InteractiveIcons";
import { SoonerProvider } from "@/components/notifications/Sooner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TRANSVERA | Modern Logistics",
  description: "Advanced shipping and delivery platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background overflow-x-hidden`}>
        <SoonerProvider>
          <Navbar />
          <main className="min-h-screen pt-20 lg:pt-16 overflow-x-hidden">{children}</main>
          <Footer />
          <InteractiveIcons />
        </SoonerProvider>
      </body>
    </html>
  );
}
