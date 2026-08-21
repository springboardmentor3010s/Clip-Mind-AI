"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import type { UserRole } from "@/types/auth";

const ROLE_RESTRICTED_ROUTES: Array<{
  path: string;
  roles: UserRole[];
}> = [
  { path: "/dashboard/users", roles: ["admin"] },
  { path: "/dashboard/manage-videos", roles: ["admin"] },
  { path: "/dashboard/admin-analytics", roles: ["admin"] },
  { path: "/dashboard/platform-settings", roles: ["admin"] },
  { path: "/dashboard/upload", roles: ["educator"] },
  { path: "/dashboard/videos", roles: ["educator"] },
  { path: "/dashboard/summaries", roles: ["educator"] },
  { path: "/dashboard/sharing", roles: ["educator"] },
  { path: "/dashboard/engagement", roles: ["educator"] },
  { path: "/dashboard/analytics", roles: ["creator"] },
  { path: "/dashboard/creator", roles: ["creator"] },
  { path: "/dashboard/history", roles: ["learner"] },
  { path: "/dashboard/bookmarks", roles: ["learner", "creator", "educator"] },
  { path: "/dashboard/my-videos", roles: ["creator", "educator", "admin"] },
];

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const matchedRoute = ROLE_RESTRICTED_ROUTES.find(
    (route) => pathname === route.path || pathname.startsWith(`${route.path}/`)
  );

  return (
    <DashboardLayout allowedRoles={matchedRoute?.roles}>
      {children}
    </DashboardLayout>
  );
}
