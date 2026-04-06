import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR Services Client Onboarding | Calibrate HCM",
  description: "Client kickoff onboarding tool for Calibrate HCM HR Services",
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
