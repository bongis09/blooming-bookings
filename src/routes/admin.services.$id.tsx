import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { upsertService, deleteService } from "@/lib/salon.functions";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/admin/services/$id")({
  component: ServiceEditPage,
  head: () => ({
    meta: [
      { title: "Edit service — Blooming GLITZ" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const CATEGORIES = [
  { value: "nails", label: "Nails 💅" },
  { value: "toes", label: "Toes 🦶" },
  { value: "pedi", label: "Pedi 🌸" },
];

const TIERS = [
  { value: "try", label: "Try Me ✨" },
  { value: "regular", label: "The Regular 💖" },
  { value: "bloom", label: "Full Bloom 🌸" },
  { value: "vip", label: "VIP 💎" },
];

function ServiceEditPage() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("admin_pin")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: service, isLoading } = useQuery({
    queryKey: ["admin-service", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  const { data: futureBookings = 0 } = useQuery({
    queryKey: ["service-future-bookings", id],
    queryFn: async () => {
      if (isNew) return 0;
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("service_id", id)
        .gte("start_at", new Date().toISOString())
        .in("status", ["confirmed", "completed"]);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !isNew,
  });

  const [name, setName] = useState("");
  const [priceRands, setPriceRands] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("nails");
  const [tier, setTier] = useState("regular");
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!service) return;
    setName(service.name ?? "");
    setPriceRands(String(((service.price_cents as number | null) ?? 0) / 100));
    setDuration(String((service.duration_minutes as number | null) ?? 0));
    setCategory(service.category ?? "nails");
    setTier(service.tier ?? "regular");
    setActive(Boolean(service.active));
    setDescription(service.description ?? "");
  }, [service]);

  if (!isNew && isLoading) {
    return <div className="p-10 text-center text-text-soft">One sec babe 🌸</div>;
  }

  const save = async () => {
    if (!settings) return;
    if (!name.trim()) {
      toast("Give it a name babe 🌸");
      return;
    }
    setSaving(true);
    try {
      const res = await upsertService({
        data: {
          pin: settings.admin_pin,
          id: isNew ? null : id,
          name: name.trim(),
          description: description.trim() || null,
          category,
          tier: tier || null,
          duration_minutes: Math.max(5, Math.round(Number(duration) || 0)),
          price_cents: Math.max(0, Math.round(Number(priceRands) * 100)),
          active,
        },
      });
      toast.success(isNew ? "Added babe 💗" : "Updated babe 💗");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["admin-service", res.id] });
      if (isNew) navigate({ to: "/admin/services" });
    } catch {
      toast("Uh oh babe, something went wrong on my side 😭 try again");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!settings || isNew) return;
    if (!confirm("Remove this service for real babe?")) return;
    setDeleting(true);
    try {
      await deleteService({ data: { pin: settings.admin_pin, id } });
      toast.success("Gone babe 💗");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      navigate({ to: "/admin/services" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen pb-20">
      <header className="px-5 pt-6 pb-4 max-w-2xl mx-auto flex items-center justify-between">
        <BrandLogo size={40} showWordmark={false} />
        <Link to="/admin/services" className="text-sm text-text-soft">
          ← Back to services
        </Link>
      </header>

      <section className="max-w-xl mx-auto px-5">
        <h1 className="font-heading text-3xl">
          {isNew ? "Add a service 💅" : name || "Edit service 💅"}
        </h1>

        <div className="mt-6 space-y-4">
          <Field label="Service name, babe">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="setting-input"
            />
          </Field>

          <Field label="Price (R)">
            <input
              type="number"
              inputMode="numeric"
              value={priceRands}
              onChange={(e) => setPriceRands(e.target.value)}
              className="setting-input"
            />
          </Field>

          <Field label="How long does it take? (minutes)">
            <input
              type="number"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="setting-input"
            />
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="setting-input"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tier">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="setting-input"
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center justify-between bg-white rounded-xl px-4 py-3 min-h-[48px]">
            <span className="text-sm text-text-dark">Show this service to clients</span>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-6 w-6 accent-gold"
            />
          </label>

          <Field label="Anything clients should know?">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="setting-input resize-none"
            />
          </Field>

          <button
            onClick={save}
            disabled={saving}
            className="btn-pill w-full flex bg-gold text-white hover:bg-gold-deep disabled:opacity-60"
          >
            {saving
              ? "One sec babe 🌸"
              : isNew
                ? "Add it babe 💗"
                : "Save changes 💗"}
          </button>

          {isNew ? (
            <Link
              to="/admin/services"
              className="btn-pill w-full flex bg-white border border-border text-text-dark"
            >
              Cancel
            </Link>
          ) : futureBookings > 0 ? (
            <div className="bg-cream-soft text-text-soft text-sm rounded-xl p-4 text-center">
              Babe, this service has future bookings, you can turn it off but not remove it yet 🌸
            </div>
          ) : (
            <button
              onClick={remove}
              disabled={deleting}
              className="btn-pill w-full flex bg-wine text-white disabled:opacity-60"
            >
              {deleting ? "One sec babe 🌸" : "Remove this service"}
            </button>
          )}
        </div>
      </section>

      <style>{`
        .setting-input {
          width: 100%;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          min-height: 48px;
          outline: none;
        }
        .setting-input:focus { border-color: var(--gold); }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-text-dark mb-1">{label}</span>
      {children}
    </label>
  );
}
