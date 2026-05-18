import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formalio — Professional Document Management",
  description: "Streamline your document workflows with Formalio.",
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
