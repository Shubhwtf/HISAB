import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HISAB — Autonomous Finance Controller & Gateway Reconciliation",
  description: "Autonomous Payment Gateway Reconciliation & Controls Engine for Indian Merchants (Razorpay / TDS Section 194-O)",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[#F8FAFC] dark:bg-[#0A0A0A] text-[#0F172A] dark:text-[#EDEDED]">
        {children}
      </body>
    </html>
  );
}
