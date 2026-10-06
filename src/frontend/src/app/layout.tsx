import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeriCare AI — Clinical Verification & Cryptographic Ledger",
  description: "Autonomous Multi-Agent Clinical Verification, RAG Citation Grounding & Cryptographic Ledger Anchoring Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
