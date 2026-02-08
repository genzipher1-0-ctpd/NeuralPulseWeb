import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PeerProvider } from "../context/PeerContext";
import MeshStatus from "../components/MeshStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neural-Pulse | 2035 Resilient Healthcare Mesh",
  description: "A decentralized P2P mesh network for resilient healthcare. Data lives in the Mesh, not the Cloud.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <PeerProvider>
          {children}
          <MeshStatus />
        </PeerProvider>
      </body>
    </html>
  );
}
