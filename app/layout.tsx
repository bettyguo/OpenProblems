import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LLM OpenProblems",
  description:
    "A rated, taxonomy-organized encyclopedia of open problems in LLM and AI research.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(
        inter.variable,
        sourceSerif.variable,
        jetbrainsMono.variable,
      )}
    >
      <body>{children}</body>
    </html>
  );
}
