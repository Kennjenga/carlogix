import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
// import { WagmiProvider, createConfig, http } from "wagmi";
// import { hederaTestnet, sepolia } from "wagmi/chains";
// import { injected } from "wagmi/connectors";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neurocar",
  description: "A site for digital cars",
};

// // Set up Wagmi config with Wagmi v2 syntax
// const wagmiConfig = createConfig({
//   chains: [hederaTestnet, sepolia],
//   transports: {
//     [hederaTestnet.id]: http(),
//     [sepolia.id]: http(),
//   },
//   connectors: [injected()],
// });

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
