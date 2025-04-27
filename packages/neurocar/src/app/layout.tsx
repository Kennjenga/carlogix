import { Providers } from "./providers";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata = {
  title: "NeuroCar",
  description: "Neural Vehicle Interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
          crossOrigin=""
        />
      </head>
      <body className={`font-sans antialiased`}>
        <main>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}
