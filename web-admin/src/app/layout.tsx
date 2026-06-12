import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "企業治理作業系統",
  description: "Enterprise Governance Operating System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" style={{ height: "100%" }}>
      <body style={{ height: "100%", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
