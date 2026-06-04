import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Game LaunchPad",
  description: "AI-powered HTML5 and WebGL game publishing platform prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
