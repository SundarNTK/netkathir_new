import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin — Netkathir Technologies",
  robots: { index: false, follow: false },
};

// Access is enforced in proxy.ts (pages) and again in every /api/admin route handler.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
