import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriDeby — Admin Web",
  description: "Dashboard do nutricionista NutriDeby",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
