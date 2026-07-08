import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatTime, formatZAR } from "@/lib/booking";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Lerato's dashboard — Blooming GLITZ ✨" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function Dashboard() {
  const now = useMemo(() => new Date(), []);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: today = [] } = useQuery({
    queryKey: ["admin-today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(name, price_cents), clients(name, phone, vip)")
        .gte("start_at", todayStart.toISOString())
        .lt("start_at", todayEnd.toISOString())
        .in("status", ["confirmed", "completed"])
        .order("start_at");
      if (error) throw error;
      return data as Array<(typeof data)[number] & { inspo_urls: string[] | null }>;
    },
  });

  const { data: week = [] } = useQuery({
    queryKey: ["admin-week"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, deposit_cents, balance_due_cents, services(price_cents)")
        .gte("start_at", todayStart.toISOString())
        .lt("start_at", weekEnd.toISOString())
        .in("status", ["confirmed", "completed"]);
      if (error) throw error;
      return data;
    },
  });

  const { data: month = [] } = useQuery({
    queryKey: ["admin-month"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, services(price_cents)")
        .gte("start_at", monthStart.toISOString())
        .lt("start_at", monthEnd.toISOString())
        .in("status", ["confirmed", "completed"]);
      if (error) throw error;
      return data;
    },
  });

  const { data: vips = [] } = useQuery({
    queryKey: ["admin-vips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, total_visits")
        .or("vip.eq.true,total_visits.gte.4")
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const todayRevenue = today.reduce(
    (sum, b) => sum + ((b.services?.price_cents as number | undefined) ?? 0),
    0,
  );
  const weekRevenue = week.reduce(
    (sum, b) => sum + ((b.services?.price_cents as number | undefined) ?? 0),
    0,
  );

  const soon = () =>
    toast(
      "Coming soon babe 🌸 for now book yourself in the WhatsApp DMs and I'll add it manually",
    );

  return (
    <main className="min-h-screen pb-28">
      <header className="px-5 pt-6 pb-4 max-w-4xl mx-auto flex items-center justify-between">
        <BrandLogo size={44} showWordmark={false} />
        <div className="flex items-center gap-4">
          <Link
            to="/admin/services"
            className="text-sm text-text-soft hover:text-gold-deep"
          >
            Services 💅
          </Link>
          <Link
            to="/admin/settings"
            className="text-sm text-text-soft hover:text-gold-deep"
          >
            Settings ⚙️
          </Link>
        </div>
      </header>

      <section className="px-5 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Today" main={`${today.length} clients`} sub={formatZAR(todayRevenue)} />
        <StatCard label="This week" main={`${week.length} booked`} sub={formatZAR(weekRevenue)} />
        <StatCard label="This month" main={`${month.length} clients`} sub="" />
        <StatCard label="VIP regulars" main={`${vips.length}`} sub="💗" />
      </section>

      <section className="px-5 max-w-4xl mx-auto mt-8">
        <h2 className="font-heading text-2xl">Today's set 💅</h2>
        {today.length === 0 ? (
          <div className="text-text-soft mt-4">No clients today — go rest babe 🌸</div>
        ) : (
          <div className="mt-4 space-y-2">
            {today.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {formatTime(b.start_at)} · {b.clients?.name ?? "Walk-in"}
                      {b.clients?.vip && <span className="ml-1">💎</span>}
                    </div>
                    <div className="text-xs text-text-soft">
                      {b.services?.name} · 💗 deposit paid
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${(b.clients?.phone ?? "").replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold-deep"
                  >
                    💬
                  </a>
                </div>
                {b.inspo_urls && b.inspo_urls.length > 0 && (
                  <InspoStrip paths={b.inspo_urls} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 max-w-4xl mx-auto mt-8">
        <h2 className="font-heading text-2xl">My VIPs 💎</h2>
        {vips.length === 0 ? (
          <div className="text-text-soft mt-4">No VIPs yet — they're coming babe 🌸</div>
        ) : (
          <div className="mt-4 space-y-2">
            {vips.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl px-4 py-3 flex justify-between shadow-sm"
              >
                <span>{v.name}</span>
                <span className="text-xs text-text-soft">{v.total_visits} visits</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-border">
        <div className="max-w-4xl mx-auto flex justify-around">
          {[
            { icon: "🚫", label: "Block slot" },
            { icon: "💅", label: "Services", to: "/admin/services" },
            { icon: "✍️", label: "Add client" },
            { icon: "⚙️", label: "Settings", to: "/admin/settings" },
          ].map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="flex-1 flex flex-col items-center py-3 text-xs text-text-soft hover:text-gold-deep"
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={soon}
                className="flex-1 flex flex-col items-center py-3 text-xs text-text-soft hover:text-gold-deep min-h-[48px]"
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </button>
            ),
          )}
        </div>
      </nav>
    </main>
  );
}

function StatCard({ label, main, sub }: { label: string; main: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="text-xs uppercase tracking-widest text-text-soft">{label}</div>
      <div className="font-heading text-xl mt-1">{main}</div>
      {sub && <div className="text-xs text-gold-deep mt-1">{sub}</div>}
    </div>
  );
}

function InspoStrip({ paths }: { paths: string[] }) {
  const { data: urls = [] } = useQuery({
    queryKey: ["admin-inspo", paths.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("inspo")
        .createSignedUrls(paths, 60 * 60 * 24 * 7);
      if (error) throw error;
      return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
    },
  });

  if (urls.length === 0) return null;

  return (
    <div className="mt-3 flex gap-2 overflow-x-auto">
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt={`Inspo ${i + 1}`}
            className="w-16 h-16 object-cover rounded-lg border border-cream-soft"
          />
        </a>
      ))}
    </div>
  );
}