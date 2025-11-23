import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Home } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Immobiliare.ai Concierge",
  description: "The AI-First Real Estate Experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      {/* Ho forzato la dark mode per l'effetto wow, rimuovi className="dark" se vuoi light di default */}
      <body className={`${inter.className} flex flex-col h-screen bg-background`}>

        {children}
      </body>
    </html>
  );
}