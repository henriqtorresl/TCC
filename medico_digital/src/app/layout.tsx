import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Médico Digital",
    template: "%s | Médico Digital",
  },
  description:
    "Plataforma clínica para anamnese, acompanhamento de atendimentos e geração de relatórios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
