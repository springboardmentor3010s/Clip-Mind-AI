import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipMind AI — Video Summarization & Key Moments Platform",
  description: "AI-powered video summarization platform. Automatically analyze videos, extract transcripts, generate concise summaries, and identify important key moments.",
  keywords: "video summarization, AI, transcription, key moments, speech to text",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
