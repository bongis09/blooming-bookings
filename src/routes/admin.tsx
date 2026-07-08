import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminPinGate, useAdminUnlocked } from "@/components/AdminPinGate";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Lerato's dashboard — Blooming GLITZ ✨" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminPage() {
  const [unlocked, setUnlocked] = useAdminUnlocked();

  if (!unlocked) {
    return <AdminPinGate onUnlock={() => setUnlocked(true)} />;
  }

  return <Outlet />;
}
