import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration, formatZAR } from "@/lib/booking";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Services — Blooming GLITZ" },
      {
        name: "description",
        content: "Nails, toes, and pedis at Blooming GLITZ. Pick your vibe babe 💅",
      },
    ],
  }),
});

type Category = "nails" | "toes" | "pedi";

const tabs: { key: Category; label: string }[] = [
  { key: "nails", label: "Nails 💅" },
  { key: "toes", label: "Toes 🦶" },
  { key: "pedi", label: "Pedi 🌸" },
];

function ServicesPage() {
  const [category, setCategory] = useState<Category>("nails");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = services.filter((s) => s.category === category);

  return (
    <main className="min-h-screen pb-24">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link to="/">
          <BrandLogo size={44} showWordmark={false} />
        </Link>
        <Link to="/" className="text-sm text-text-soft">
          ← Home
        </Link>
      </header>

      <div className="px-5 max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl text-text-dark">
          What are we doing today? 💅
        </h1>
        <p className="text-text-soft mt-1">Pick the one that's speaking to you</p>

        <div className="mt-6 flex gap-2 overflow-x-auto -mx-1 px-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setCategory(t.key)}
              className={`btn-pill px-5 py-2 text-sm whitespace-nowrap ${
                category === t.key
                  ? "bg-gold text-white shadow-md"
                  : "bg-white text-text-dark border border-border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <div className="text-center text-text-soft py-10">One sec babe 🌸</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center text-text-soft py-10">
              Hmm, no services in this category yet — but I'm adding more soon 🌸
            </div>
          )}
          {filtered.map((s) => (
            <Link
              key={s.id}
              to="/book"
              search={{ serviceId: s.id }}
              className="block bg-white rounded-2xl p-5 border border-transparent hover:border-gold transition-all active:scale-[0.99] shadow-sm"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="font-heading text-lg text-text-dark">{s.name}</div>
                  {s.description && (
                    <div className="text-sm text-text-soft mt-1">{s.description}</div>
                  )}
                  <div className="text-xs text-text-soft mt-2">
                    ⏱ {formatDuration(s.duration_minutes)}
                  </div>
                </div>
                <div className="font-heading text-lg text-gold-deep whitespace-nowrap">
                  {formatZAR(s.price_cents)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
