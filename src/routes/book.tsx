import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createBooking } from "@/lib/salon.functions";
import {
  formatDayShort,
  formatDuration,
  formatZAR,
  generateDaySlots,
  upcomingOpenDays,
  type WorkingHours,
} from "@/lib/booking";
import { BrandLogo } from "@/components/BrandLogo";


const searchSchema = z.object({
  serviceId: z.string().optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: searchSchema,
  component: BookPage,
  head: () => ({
    meta: [
      { title: "Book — Blooming GLITZ" },
      { name: "description", content: "Book your nails with Lerato 💅" },
    ],
  }),
});

type Step = "service" | "slot" | "details";

function BookPage() {
  const { serviceId: initialServiceId } = Route.useSearch();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(initialServiceId ? "slot" : "service");
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId ?? null);
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [dayIndex, setDayIndex] = useState(0);

  const { data: services = [] } = useQuery({
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

  const { data: settings } = useQuery({
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

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  return (
    <main className="min-h-screen pb-24 bg-cream">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link to="/">
          <BrandLogo size={44} showWordmark={false} />
        </Link>
        <div className="text-xs text-text-soft">
          Step {step === "service" ? 1 : step === "slot" ? 2 : 3} of 3
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5">
        {step === "service" && (
          <ServiceStep
            services={services}
            onPick={(id) => {
              setServiceId(id);
              setStep("slot");
            }}
          />
        )}

        {step === "slot" && service && settings && (
          <SlotStep
            service={service}
            settings={settings}
            dayIndex={dayIndex}
            setDayIndex={setDayIndex}
            slotStart={slotStart}
            setSlotStart={setSlotStart}
            onBack={() => setStep("service")}
            onNext={() => slotStart && setStep("details")}
          />
        )}

        {step === "details" && service && settings && slotStart && (
          <DetailsStep
            service={service}
            settings={settings}
            slotStart={slotStart}
            onBack={() => setStep("slot")}
            onDone={(bookingId) => navigate({ to: "/confirmation/$id", params: { id: bookingId } })}
          />
        )}
      </div>
    </main>
  );
}

/* --------------------------- Step 1: Service --------------------------- */

function ServiceStep({
  services,
  onPick,
}: {
  services: Array<{ id: string; name: string; description: string | null; category: string; duration_minutes: number; price_cents: number }>;
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <h1 className="font-heading text-3xl">What are we doing today? 💅</h1>
      <p className="text-text-soft mt-1">Pick the one that's speaking to you</p>
      <div className="mt-6 space-y-3">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className="w-full text-left bg-white rounded-2xl p-5 border border-transparent hover:border-gold active:scale-[0.99] shadow-sm"
          >
            <div className="flex justify-between gap-3">
              <div>
                <div className="font-heading text-lg">{s.name}</div>
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
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Step 2: Slot --------------------------- */

function SlotStep({
  service,
  settings,
  dayIndex,
  setDayIndex,
  slotStart,
  setSlotStart,
  onBack,
  onNext,
}: {
  service: { id: string; name: string; duration_minutes: number };
  settings: { working_hours: unknown; buffer_minutes: number };
  dayIndex: number;
  setDayIndex: (n: number) => void;
  slotStart: Date | null;
  setSlotStart: (d: Date | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const workingHours = settings.working_hours as WorkingHours;
  const openDays = useMemo(() => upcomingOpenDays(workingHours, 14), [workingHours]);
  const day = openDays[dayIndex];

  const rangeStart = day ? new Date(day) : new Date();
  const rangeEnd = day ? new Date(day.getTime() + 86_400_000) : new Date();

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", day?.toDateString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("start_at, end_at, status")
        .gte("start_at", rangeStart.toISOString())
        .lt("start_at", rangeEnd.toISOString())
        .in("status", ["confirmed", "pending"]);
      if (error) throw error;
      return data;
    },
    enabled: !!day,
  });

  const { data: blocked = [] } = useQuery({
    queryKey: ["blocked", day?.toDateString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("start_at, end_at")
        .gte("start_at", rangeStart.toISOString())
        .lt("start_at", rangeEnd.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: !!day,
  });

  const slots = useMemo(() => {
    if (!day) return [];
    return generateDaySlots({
      date: day,
      workingHours,
      bookings,
      blocked,
      serviceDurationMinutes: service.duration_minutes,
      bufferMinutes: settings.buffer_minutes,
    });
  }, [day, workingHours, bookings, blocked, service.duration_minutes, settings.buffer_minutes]);

  const openSlots = slots.filter((s) => !s.taken);

  return (
    <div>
      <button onClick={onBack} className="text-xs text-text-soft">
        ← Change service
      </button>
      <h1 className="font-heading text-3xl mt-2">When are you free, babe? 📅</h1>
      <p className="text-text-soft mt-1">Tap a slot to hold it</p>

      <div className="mt-6 flex gap-2 overflow-x-auto -mx-5 px-5 pb-2">
        {openDays.map((d, i) => {
          const active = i === dayIndex;
          return (
            <button
              key={d.toISOString()}
              onClick={() => {
                setDayIndex(i);
                setSlotStart(null);
              }}
              className={`min-w-[92px] rounded-2xl px-3 py-3 text-sm text-center border transition-all ${
                active
                  ? "bg-gold text-white border-gold shadow-md"
                  : "bg-white text-text-dark border-border"
              }`}
            >
              {formatDayShort(d)}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-soft mt-4">
        Buffer time built in babe, no rushing 🌸
      </p>

      {slots.length === 0 && (
        <div className="text-center text-text-soft py-10">
          This day's fully booked 😭 check the next one
        </div>
      )}

      {slots.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map((s) => {
            const picked = slotStart?.getTime() === s.start.getTime();
            const lastOne = !s.taken && openSlots.length === 1;
            return (
              <button
                key={s.start.toISOString()}
                disabled={s.taken}
                onClick={() => setSlotStart(s.start)}
                className={`rounded-full py-3 text-sm min-h-[48px] transition-all ${
                  s.taken
                    ? "bg-cream-soft text-text-soft line-through cursor-not-allowed"
                    : picked
                      ? "bg-wine text-white shadow-lg"
                      : "bg-white border border-gold text-text-dark hover:bg-gold hover:text-white"
                }`}
              >
                {s.taken ? `${s.label} ✕` : lastOne ? `${s.label} 💗` : s.label}
              </button>
            );
          })}
        </div>
      )}

      {slotStart && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 backdrop-blur border-t border-border">
          <button
            onClick={onNext}
            className="btn-pill w-full max-w-lg mx-auto flex bg-gold text-white hover:bg-gold-deep"
          >
            Almost done →
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Step 3: Details + Deposit --------------------------- */

function DetailsStep({
  service,
  settings,
  slotStart,
  onBack,
  onDone,
}: {
  service: { id: string; name: string; duration_minutes: number; price_cents: number };
  settings: { deposit_cents: number };
  slotStart: Date;
  onBack: () => void;
  onDone: (bookingId: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [inspoFiles, setInspoFiles] = useState<File[]>([]);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const deposit = settings.deposit_cents;
  const balance = service.price_cents - deposit;
  const slotEnd = new Date(slotStart.getTime() + service.duration_minutes * 60_000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms) {
      toast("Tick the deposit box babe 🌸");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    if (cleanPhone.length < 9) {
      toast("That number doesn't look right, babe — double check for me? 💗");
      return;
    }

    setSubmitting(true);
    try {
      // Upload inspo pictures first (private "inspo" bucket, anon has insert policy)
      const inspoPaths: string[] = [];
      for (const file of inspoFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("inspo")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        inspoPaths.push(path);
      }

      // ⚠️ STUB: real Yoco payment would happen here. Server marks deposit_paid = true.
      const booking = await createBooking({
        data: {
          name,
          phone: cleanPhone,
          email: email || null,
          marketing,
          notes: notes || null,
          serviceId: service.id,
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          inspoPaths,
        },
      });



      toast.success("Deposit received babe 💗 you're locked in 🌸");
      onDone(booking.id);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("overlap") || msg.includes("23p01")) {
        toast("Oh no, that slot just got taken 💔 pick another one babe");
      } else {
        toast(
          "Uh oh babe, something went wrong on my side 😭 try again, if it keeps happening just WhatsApp me 💗",
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-xs text-text-soft">
        ← Change slot
      </button>
      <h1 className="font-heading text-3xl mt-2">Tell me about you 🌸</h1>
      <p className="text-text-soft mt-1">So I can confirm your spot</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Your name, babe">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-gold min-h-[48px]"
          />
        </Field>

        <Field label="WhatsApp number (so I can remind you 💗)">
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="083 123 4567"
            className="w-full bg-white rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-gold min-h-[48px]"
          />
        </Field>

        <Field label="Email (optional, for the goodies 💌)">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-gold min-h-[48px]"
          />
        </Field>

        <Field label="Anything I should know? (allergies, shape, inspo)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-white rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-gold resize-none"
          />
        </Field>

        <div className="bg-gradient-to-br from-rose/30 to-cream-soft rounded-2xl p-5">
          <div className="font-heading text-lg">Hold your spot 💗</div>
          <p className="text-sm text-text-soft mt-1">
            Pay a small deposit now to lock in your slot. It comes off your final bill, so
            you're not paying extra.
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-text-dark">Deposit</span>
            <span className="font-heading text-2xl text-gold-deep">
              {formatZAR(deposit)}
            </span>
          </div>
          <p className="text-xs text-text-soft mt-2">
            Refunded if you cancel 24h+ before. Non-refundable inside 24h.
          </p>
        </div>

        <label className="flex items-start gap-3 text-sm text-text-dark">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 w-5 h-5 accent-gold"
          />
          <span>I understand the deposit rules 🌸</span>
        </label>

        <label className="flex items-start gap-3 text-sm text-text-dark">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="mt-1 w-5 h-5 accent-gold"
          />
          <span>
            Send me Lerato's tips and sets (you can unsubscribe anytime, no stress)
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="btn-pill w-full flex bg-gold text-white shadow-lg shadow-gold/30 hover:bg-gold-deep disabled:opacity-60"
        >
          {submitting
            ? "One sec babe 🌸"
            : `Pay deposit ${formatZAR(deposit)} & confirm 💗`}
        </button>

        <p className="text-[10px] text-text-soft text-center">
          Yoco payments coming soon — for now the deposit is marked as paid so you can test
          the flow ✨
        </p>
      </form>
    </div>
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
