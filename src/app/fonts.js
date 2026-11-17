// Polices du site, déclarées une seule fois par next/font et partagées par les deux
// layouts racines : le site public (`[lang]`) et le tableau de bord (`admin`).
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";

export const titleFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-title",
  display: "swap",
});

export const textFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});
