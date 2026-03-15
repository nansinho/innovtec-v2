import type { Metadata } from "next";
import { Toaster } from "sonner";
import ThemeInitializer from "@/components/theme-initializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "INNOVTEC Réseaux — Intranet",
  description: "Intranet de gestion INNOVTEC Réseaux",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Sora:wght@100..800&family=JetBrains+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeInitializer />
        {children}
        <Toaster richColors position="top-right" duration={3000} />
      </body>
    </html>
  );
}
