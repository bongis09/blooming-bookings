import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatZAR, formatDuration } from "@/lib/booking";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/admin/services/")({
  component: ServicesAdminPage,
});

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  tier: string | null;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
  display_order: number;
};

const TIER_META: Record<string, { label: string; emoji: string }> = {
  try: { label: "Try", emoji: "✨" },
  regular: { label: "Regular", emoji: "💖" },
  bloom: { label: "Bloom", emoji: "🌸" },
  vip: { label: "VIP", emoji: "💎" },
};

function tierBadge(tier: string | null) {
  if (!tier) return null;
  const key = tier.toLowerCase().split(/\s+/)[0];
  const meta = TIER_META[key] ?? { label: tier, emoji: "🌸" };
  return (
    <span className="inline-flex items-center gap-1 text-[11px] bg-cream-soft text-text-dark rounded-full px-2 py-0.5">
      {meta.label} {meta.emoji}
    </span>
  );
}

function nailsSubCategory(name: string): "Acrylic" | "Polygel" | "Gel X" | "Other" {
  const n = name.toLowerCase();
  if (n.includes("acrylic")) return "Acrylic";
  if (n.includes("polygel")) return "Polygel";
  if (n.includes("gel x") || n.includes("gelx")) return "Gel X";
  return "Other";
}

function ServicesAdminPage() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Service[];
    },
  });

  const nails = services.filter((s) => s.category === "nails");
  const toesExtras = services.filter((s) => s.category !== "nails");

  const nailsSub: Record<string, Service[]> = {
    Acrylic: [],
    Polygel: [],
    "Gel X": [],
    Other: [],
  };
  for (const s of nails) nailsSub[nailsSubCategory(s.name)].push(s);

  return (
    <main className="min-h-screen pb-24">
      <header className="px-5 pt-6 pb-4 max-w-3xl mx-auto flex items-center justify-between">
        <BrandLogo size={40} showWordmark={false} />
        <Link to="/admin" className="text-sm text-text-soft">
          ← Dashboard
        </Link>
      </header>

      <section className="max-w-2xl mx-auto px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl">My services 💅</h1>
            <p className="text-text-soft text-sm mt-1">
              Tap any service to edit the price, how long it takes, or turn it off babe 🌸
            </p>
          </div>
          <Link
            to="/admin/services/$id"
            params={{ id: "new" }}
            className="btn-pill shrink-0 bg-gold text-white hover:bg-gold-deep whitespace-nowrap px-4 py-2 text-sm"
          >
            + Add service 💅
          </Link>
        </div>

        {isLoading && <div className="mt-8 text-center text-text-soft">One sec babe 🌸</div>}

        {!isLoading && services.length === 0 && (
          <div className="mt-8 text-center text-text-soft bg-white rounded-2xl p-6">
            No services yet babe, tap the button above to add one 🌸
          </div>
        )}

        {!isLoading && services.length > 0 && (
          <div className="mt-8 space-y-8">
            {nails.length > 0 && (
              <div className="space-y-6">
                <SectionHeader label="Nails 💅" />
                {(["Acrylic", "Polygel", "Gel X", "Other"] as const).map((sub) =>
                  nailsSub[sub].length === 0 ? null : (
                    <SubSection key={sub} label={sub} services={nailsSub[sub]} />
                  ),
                )}
              </div>
            )}

            {toesExtras.length > 0 && (
              <div className="space-y-4">
                <SectionHeader label="Toes + Extras 🦶" />
                <ServiceList services={toesExtras} />
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="bg-wine text-white rounded-full px-5 py-2 font-heading text-sm tracking-wide inline-block">
      {label}
    </div>
  );
}

function SubSection({ label, services }: { label: string; services: Service[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-gold-deep mb-2 pl-1">
        {label}
      </div>
      <ServiceList services={services} />
    </div>
  );
}

function ServiceList({ services }: { services: Service[] }) {
  return (
    <div className="space-y-2">
      {services.map((s) => (
        <Link
          key={s.id}
          to="/admin/services/$id"
          params={{ id: s.id }}
          className={`block bg-white rounded-2xl px-4 py-3 shadow-sm active:scale-[0.99] transition ${
            s.active ? "" : "opacity-60"
          }`}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-text-dark">{s.name}</span>
                {tierBadge(s.tier)}
                {!s.active && (
                  <span className="text-[10px] uppercase tracking-widest bg-cream-soft text-text-soft rounded-full px-2 py-0.5">
                    Off
                  </span>
                )}
              </div>
              <div className="text-xs text-text-soft mt-1">
                {formatDuration(s.duration_minutes)}
              </div>
            </div>
            <div className="font-heading text-lg text-gold-deep whitespace-nowrap">
              {formatZAR(s.price_cents)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}