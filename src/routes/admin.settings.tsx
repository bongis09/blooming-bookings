import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateAdminSettings } from "@/lib/salon.functions";
import { BrandLogo } from "@/components/BrandLogo";


export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Blooming GLITZ" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: s } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [depositRands, setDepositRands] = useState("");
  const [buffer, setBuffer] = useState("");
  const [cancelHours, setCancelHours] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!s) return;
    setDepositRands(String(s.deposit_cents / 100));
    setBuffer(String(s.buffer_minutes));
    setCancelHours(String(s.cancellation_hours));
    setWhatsapp(s.whatsapp_business_number);
    setPin(s.admin_pin);
  }, [s]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("settings")
      .update({
        deposit_cents: Math.round(Number(depositRands) * 100),
        buffer_minutes: Number(buffer),
        cancellation_hours: Number(cancelHours),
        whatsapp_business_number: whatsapp.replace(/[^0-9]/g, ""),
        admin_pin: pin.replace(/\D/g, "").slice(0, 4) || "1234",
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast("Couldn't save babe 😭 try again");
      return;
    }
    toast.success("Saved babe 💗");
    qc.invalidateQueries({ queryKey: ["settings"] });
  };

  if (!s) {
    return <div className="p-10 text-center text-text-soft">One sec babe 🌸</div>;
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="px-5 pt-6 pb-4 max-w-2xl mx-auto flex items-center justify-between">
        <BrandLogo size={40} showWordmark={false} />
        <Link to="/admin" className="text-sm text-text-soft">
          ← Dashboard
        </Link>
      </header>

      <section className="max-w-xl mx-auto px-5">
        <h1 className="font-heading text-3xl">Settings ⚙️</h1>
        <p className="text-text-soft text-sm mt-1">
          The knobs and dials babe — change what you need
        </p>

        <div className="mt-6 space-y-4">
          <SettingField label="Your deposit amount (R)">
            <input
              type="number"
              value={depositRands}
              onChange={(e) => setDepositRands(e.target.value)}
              className="setting-input"
            />
          </SettingField>

          <SettingField label="Buffer between clients (minutes)">
            <input
              type="number"
              value={buffer}
              onChange={(e) => setBuffer(e.target.value)}
              className="setting-input"
            />
          </SettingField>

          <SettingField label="Cancellation window (hours)">
            <input
              type="number"
              value={cancelHours}
              onChange={(e) => setCancelHours(e.target.value)}
              className="setting-input"
            />
          </SettingField>

          <SettingField label="Your WhatsApp number (with country code, no +)">
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="27692281472"
              className="setting-input"
            />
          </SettingField>

          <SettingField label="Admin PIN (4 digits)">
            <input
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="setting-input tracking-[0.5em] text-center"
            />
          </SettingField>

          <SettingField label="Working hours">
            <div className="bg-cream-soft rounded-xl p-3 text-sm text-text-soft">
              Tue–Sat · 08:30 – 16:30 (edit coming soon babe 🌸)
            </div>
          </SettingField>

          <SettingField label="Your public booking link">
            <div className="bg-cream-soft rounded-xl p-3 text-sm text-text-dark break-all">
              {typeof window !== "undefined" ? `${window.location.origin}/book` : "/book"}
            </div>
          </SettingField>

          <button
            onClick={save}
            disabled={saving}
            className="btn-pill w-full flex bg-gold text-white hover:bg-gold-deep disabled:opacity-60"
          >
            {saving ? "One sec babe 🌸" : "Save changes 💗"}
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem("blooming-glitz-pin-ok");
              window.location.href = "/";
            }}
            className="btn-pill w-full flex bg-white border border-wine text-wine"
          >
            Sign out
          </button>
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

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-text-dark mb-1">{label}</span>
      {children}
    </label>
  );
}
