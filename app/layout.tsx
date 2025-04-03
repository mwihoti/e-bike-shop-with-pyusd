import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"

import { WalletProvider } from "@/hooks/use-wallet"
import { OrdersProvider } from "@/hooks/use-orders";
import { CartProvider } from "@/hooks/use-cart"
import { AuthProvider } from "@/contexts/auth-context"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PYUSD Transfer & marketplace",
  description: "Send, receive and shop with PYUSD using GCP's Blockchain RPC for ethereum transactions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
        <WalletProvider>
          <OrdersProvider>
          <CartProvider>
          {children}

          </CartProvider>
          </OrdersProvider>
        </WalletProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
