import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildConfirmationMessage,
  formatDayLong,
  formatDuration,
  formatTime,
  formatZAR,
  whatsAppLink,
} from "@/lib/booking";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/confirmation/$id")({
  component: ConfirmationPage,
  head: () => ({
    meta: [
      { title: "You're in babe 🌸 — Blooming GLITZ" },
      { name: "description", content: "Your Blooming GLITZ booking is confirmed 💗" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-heading text-xl">Can't find that booking babe 😭</p>
        <Link to="/" className="btn-pill bg-gold text-white mt-4 inline-flex">
          Home 🌸
        </Link>
      </div>
    </div>
  ),
});

function ConfirmationPage() {
  const { id } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(*), clients(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("whatsapp_business_number")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const inspoPaths = (data?.inspo_urls ?? []) as string[];
  const { data: inspoLinks = [] } = useQuery({
    queryKey: ["inspo-signed", id, inspoPaths.join(",")],
    enabled: inspoPaths.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("inspo")
        .createSignedUrls(inspoPaths, 60 * 60 * 24 * 365);
      if (error) throw error;
      return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-soft">
        One sec babe 🌸
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const service = data.services;
  const dayLabel = formatDayLong(data.start_at);
  const timeLabel = formatTime(data.start_at);
  const baseMessage = buildConfirmationMessage({
    dayLabel,
    timeLabel,
    depositCents: data.deposit_cents,
    balanceCents: data.balance_due_cents,
  });
  const message =
    inspoLinks.length > 0
      ? `${baseMessage}\n\nMy inspo 📸\n${inspoLinks.join("\n")}`
      : baseMessage;
  const waNumber = settings?.whatsapp_business_number ?? "27692281472";

  const addToCalendar = () => {
    const dtStart = new Date(data.start_at)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const dtEnd = new Date(data.end_at)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Blooming GLITZ — ${service?.name ?? "Nails"}`)}&dates=${dtStart}/${dtEnd}&details=${encodeURIComponent(message)}&location=${encodeURIComponent("Toti Mall, Amanzimtoti")}`;
    window.open(url, "_blank");
  };

  return (
    <main className="min-h-screen">
      <header className="px-5 pt-6 pb-4 max-w-3xl mx-auto flex justify-between items-center">
        <BrandLogo size={44} showWordmark={false} />
      </header>

      <section className="max-w-xl mx-auto px-5">
        <div className="text-center py-6">
          <div className="text-6xl">🌸</div>
          <h1 className="font-display text-6xl text-gold-deep mt-2">You're in babe</h1>
          <p className="mt-3 text-text-dark">
            I got you, see you on <strong>{dayLabel}</strong> at{" "}
            <strong>{timeLabel}</strong> 💗
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg border border-cream-soft">
          <Row label="Service" value={service?.name ?? "—"} />
          <Row label="Date" value={dayLabel} />
          <Row label="Time" value={timeLabel} />
          <Row
            label="Duration"
            value={service ? formatDuration(service.duration_minutes) : "—"}
          />
          <Row
            label="Deposit paid"
            value={
              <span>
                {formatZAR(data.deposit_cents)}{" "}
                <span className="text-teal">✅</span>
              </span>
            }
          />
          <Row
            label="Balance on the day"
            value={formatZAR(data.balance_due_cents)}
            last
          />
        </div>

        {inspoLinks.length > 0 && (
          <div className="mt-6 bg-white rounded-3xl p-5 shadow-sm border border-cream-soft">
            <div className="text-xs uppercase tracking-widest text-text-soft mb-3">
              Your inspo 📸
            </div>
            <div className="grid grid-cols-3 gap-2">
              {inspoLinks.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Inspo ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                </a>
              ))}
            </div>
          </div>
        )}


        <div className="mt-6 space-y-3">
          <button
            onClick={addToCalendar}
            className="btn-pill w-full flex bg-gold text-white hover:bg-gold-deep"
          >
            Add to my calendar 📅
          </button>
          <a
            href={whatsAppLink(waNumber, message)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill w-full flex bg-[#25D366] text-white hover:opacity-90"
            onClick={() => toast("Opening WhatsApp babe 💬")}
          >
            Copy to WhatsApp 💬
          </a>
          <Link
            to="/"
            className="btn-pill w-full flex bg-white border border-border text-text-dark"
          >
            Done
          </Link>
        </div>

        <div className="mt-8 bg-cream-soft rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-text-soft mb-2">
            Message preview
          </div>
          <pre className="whitespace-pre-wrap font-body text-sm text-text-dark">
            {message}
          </pre>
        </div>

        <p className="text-[10px] text-text-soft text-center mt-4 mb-10">
          Auto WhatsApp reminders coming soon — for now tap "Copy to WhatsApp" to send it
          yourself ✨
        </p>
      </section>
    </main>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-3 ${
        last ? "" : "border-b border-cream-soft"
      }`}
    >
      <span className="text-text-soft text-sm">{label}</span>
      <span className="text-text-dark font-medium text-right">{value}</span>
    </div>
  );
}
