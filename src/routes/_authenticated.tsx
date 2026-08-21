import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "../layouts/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("clipmind_token");

    if (!token) {
      throw redirect({ to: "/login" });
    }
  },

  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});