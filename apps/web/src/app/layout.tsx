import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AgentDeck",
  description: "Local-first workspace for multi-agent coding and workflow orchestration.",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
