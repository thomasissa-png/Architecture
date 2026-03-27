"use client";

/**
 * MerchantBrandWrapper — Wraps merchant-branded content with custom font + colors.
 *
 * Applies the merchant's chosen font and brand colors as CSS custom properties.
 * All 5 Google Fonts are already imported in globals.css.
 *
 * Supported fonts: Inter (site default), Playfair Display, Montserrat, Lora, DM Sans.
 *
 * PDF limitation: pdf-lib only supports StandardFonts (no custom embed).
 * Mapping: Inter/Montserrat/DM Sans -> Helvetica, Playfair Display/Lora -> TimesRoman.
 */

import { ReactNode } from "react";

interface MerchantBrandWrapperProps {
  font?: string | null;
  couleurPrincipale?: string | null;
  couleurSecondaire?: string | null;
  children: ReactNode;
}

export default function MerchantBrandWrapper({
  font,
  couleurPrincipale,
  couleurSecondaire,
  children,
}: MerchantBrandWrapperProps) {
  const fontFamily =
    font && font !== "Inter" ? `'${font}', sans-serif` : "inherit";

  return (
    <div
      style={
        {
          "--brand-font": fontFamily,
          "--brand-primary": couleurPrincipale || "#7D9B76",
          "--brand-secondary": couleurSecondaire || "#1C1C1E",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
