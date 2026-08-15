import "./globals.css";

export const metadata = {
  title: "ClipMind AI",
  description: "AI-powered video summarization & key moments detection platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}