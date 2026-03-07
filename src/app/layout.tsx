import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeetCity — Your LeetCode Skyline",
  description: "Visualize your LeetCode stats as a 3D city skyline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#020712",
          overflow: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
