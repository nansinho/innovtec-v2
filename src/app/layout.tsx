import type { Metadata } from "next";
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
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
