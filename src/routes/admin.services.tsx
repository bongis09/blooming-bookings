import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/services")({
  component: () => <Outlet />,
  head: () => ({
    meta: [
      { title: "My services — Blooming GLITZ" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
