import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisiRénov — Home Staging IA pour Marchands de Biens",
  description:
    "Visualisez le potentiel de vos biens en quelques secondes grâce à l'intelligence artificielle. Home staging virtuel pour professionnels de l'immobilier.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
