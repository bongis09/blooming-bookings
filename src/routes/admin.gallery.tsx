import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/gallery")({
  component: () => <Outlet />,
  head: () => ({
    meta: [
      { title: "My gallery — Blooming GLITZ 💅" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
