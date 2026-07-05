// Booking helpers — pure functions used by the client booking flow and admin dashboard.

export function formatZAR(cents: number): string {
  const rands = Math.round(cents) / 100;
  return `R${rands.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDayShort(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDayLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export type WorkingHours = Record<
  "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  { start: string; end: string } | null
>;

const DAY_KEYS: (keyof WorkingHours)[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

interface SlotArgs {
  date: Date; // day (local)
  workingHours: WorkingHours;
  bookings: { start_at: string; end_at: string }[];
  blocked: { start_at: string; end_at: string }[];
  serviceDurationMinutes: number;
  bufferMinutes: number;
}

export interface Slot {
  start: Date;
  end: Date;
  label: string; // "10:30"
  taken: boolean;
}

/** Generate 30-min-granularity slots for one day, marking overlaps as taken. */
export function generateDaySlots({
  date,
  workingHours,
  bookings,
  blocked,
  serviceDurationMinutes,
  bufferMinutes,
}: SlotArgs): Slot[] {
  const dayKey = DAY_KEYS[date.getDay()];
  const hours = workingHours[dayKey];
  if (!hours) return [];

  const slots: Slot[] = [];
  const [startH, startM] = hours.start.split(":").map(Number);
  const [endH, endM] = hours.end.split(":").map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(startH, startM, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(endH, endM, 0, 0);

  const now = new Date();
  const step = 30;

  const busy = [...bookings, ...blocked].map((b) => ({
    start: new Date(b.start_at).getTime(),
    end: new Date(b.end_at).getTime() + bufferMinutes * 60_000,
  }));

  for (
    let cursor = new Date(dayStart);
    cursor.getTime() + serviceDurationMinutes * 60_000 <= dayEnd.getTime();
    cursor = new Date(cursor.getTime() + step * 60_000)
  ) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + serviceDurationMinutes * 60_000);
    const inPast = slotStart.getTime() < now.getTime();
    const overlaps = busy.some(
      (b) => slotStart.getTime() < b.end && slotEnd.getTime() > b.start,
    );
    slots.push({
      start: slotStart,
      end: slotEnd,
      label: slotStart.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      taken: inPast || overlaps,
    });
  }
  return slots;
}

/** Build the exact WhatsApp confirmation message (Lerato voice, from Copy Bible §2.7). */
export function buildConfirmationMessage(args: {
  dayLabel: string;
  timeLabel: string;
  depositCents: number;
  balanceCents: number;
}): string {
  return [
    `Hey babe🌸 you're booked in! See you ${args.dayLabel} at ${args.timeLabel}, can't wait 💗`,
    `Your deposit of ${formatZAR(args.depositCents)} is in.`,
    `The rest — ${formatZAR(args.balanceCents)} — you settle when you get here 🌸`,
    `I'll send you a reminder the day before.`,
    `— Lerato 💅`,
  ].join("\n");
}

/** Encode a message into a WhatsApp click-to-chat URL. */
export function whatsAppLink(phoneDigits: string, message: string): string {
  const cleanedNumber = phoneDigits.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(message)}`;
}

/** Build the next N days starting today (skip null-hour days). */
export function upcomingOpenDays(workingHours: WorkingHours, count = 14): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    const key = DAY_KEYS[cursor.getDay()];
    if (workingHours[key]) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
