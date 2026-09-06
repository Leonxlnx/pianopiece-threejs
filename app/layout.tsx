import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  other: { "codex-preview": "development" },
  title: "Daybreak · A piano performance",
  icons: { icon: "/favicon.svg" },
  description: "An original piano-led cinematic piece. A grand piano, one performer, and the first light of day. Play the complete audiovisual performance.",
  openGraph: {
    title: "Daybreak · An original piano performance",
    description: "A lyrical piano piece performed by a visible 3D pianist in a sunlit recital pavilion. Sound on.",
    url: "https://daybreak-piano-film.lexn8.chatgpt.site",
    type: "website",
    images: [{ url: "https://daybreak-piano-film.lexn8.chatgpt.site/assets/stage-poster.webp", width: 1920, height: 1080, alt: "The Daybreak pianist at a concert grand in a sunlit recital pavilion" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
