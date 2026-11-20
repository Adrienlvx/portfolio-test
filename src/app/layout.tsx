import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atlas visuel — Atelier Atlas",
  description: "Une collection d’illustrations, d’affiches et d’études visuelles à explorer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
