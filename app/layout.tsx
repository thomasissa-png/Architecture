import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisiRénov — Home Staging IA | Architectes, Marchands de Biens & Particuliers",
  description:
    "Visualisez vos espaces meublés par l'IA en quelques minutes. 11 styles de décoration, téléchargement HD gratuit. Pour architectes, marchands de biens et particuliers.",
  keywords: ["home staging", "IA", "décoration intérieure", "virtual staging", "immobilier", "architecture", "meuble par IA"],
  openGraph: {
    title: "VisiRénov — Meublez vos espaces par l'IA",
    description: "Uploadez une photo de pièce vide, choisissez un style, recevez un visuel meublé en quelques minutes.",
    type: "website",
  },
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
