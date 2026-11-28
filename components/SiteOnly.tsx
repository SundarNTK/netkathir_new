"use client";

import { usePathname } from "next/navigation";

/** Renders the public-site chrome (intro, 3D background, nav, footer, effects) everywhere except the admin area. */
export default function SiteOnly({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path?.startsWith("/admin")) return null;
  return <>{children}</>;
}
