import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TimezoneCookieSync } from "@/components/app/timezone-cookie-sync";

const jetbrainsSans = JetBrains_Mono({
  variable: "--font-jetbrains-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodaTrack",
  description: "Practice, consistently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem("theme");
                  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var theme = (stored === "light" || stored === "dark") ? stored : (systemDark ? "dark" : "light");
                  document.documentElement.classList.toggle("dark", theme === "dark");
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${jetbrainsSans.variable} ${jetbrainsMono.variable} antialiased`}>
        <TimezoneCookieSync />
        {children}
      </body>
    </html>
  );
}
