import type { Metadata } from "next";

// Admin pages must never be indexed (also sent as X-Robots-Tag in next.config).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
