import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formalio Admin",
  description: "Formalio administration dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
