import "./globals.css";
import React from "react";

export const metadata = {
  title: "PayPal Split & Bill Workbench",
  description: "Multimodal Receipt & Freelance DM Parser -> Live PayPal Invoicing v2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
