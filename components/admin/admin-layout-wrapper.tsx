"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "./admin-nav";
import { adminPaths } from "@/lib/paths";

const NO_NAV_PATHS: string[] = [
  adminPaths.signIn,
  adminPaths.signUp,
  adminPaths.unauthorized,
];

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !NO_NAV_PATHS.includes(pathname);

  if (!showNav) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav />
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
