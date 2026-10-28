import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentry Intel - Threat Intelligence Dashboard",
  description: "AI-powered open-source threat intelligence dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
