import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(180).optional().nullable(),
  marketing: z.boolean(),
  notes: z.string().max(500).optional().nullable(),
  serviceId: z.string().uuid(),
  startAt: z.string().min(10),
  endAt: z.string().min(10),
  inspoPaths: z.array(z.string().max(300)).max(6).optional().default([]),
});


export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleanPhone = data.phone.replace(/[^0-9+]/g, "");

    const { data: service, error: svcErr } = await supabaseAdmin
      .from("services")
      .select("id, price_cents, active")
      .eq("id", data.serviceId)
      .single();
    if (svcErr || !service || !service.active) {
      throw new Error("Service not available");
    }

    const { data: settingsRow } = await supabaseAdmin
      .from("settings")
      .select("deposit_cents")
      .eq("id", 1)
      .single();
    const deposit = settingsRow?.deposit_cents ?? 5000;
    const balance = Math.max(0, service.price_cents - deposit);

    const { data: existing } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    let clientId = existing?.id;
    if (!clientId) {
      const { data: created, error } = await supabaseAdmin
        .from("clients")
        .insert({
          name: data.name,
          phone: cleanPhone,
          email: data.email || null,
          marketing_opt_in: data.marketing,
          notes: data.notes || null,
        })
        .select("id")
        .single();
      if (error || !created) throw new Error(error?.message ?? "Could not save client");
      clientId = created.id;
    } else {
      await supabaseAdmin
        .from("clients")
        .update({
          name: data.name,
          email: data.email || null,
          marketing_opt_in: data.marketing,
        })
        .eq("id", clientId);
    }

    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        client_id: clientId,
        service_id: data.serviceId,
        start_at: data.startAt,
        end_at: data.endAt,
        status: "confirmed",
        deposit_cents: deposit,
        deposit_paid: true,
        balance_due_cents: balance,
        notes: data.notes || null,
        source: "app",
        inspo_urls: data.inspoPaths ?? [],
      })
      .select("id")
      .single();
    if (bErr || !booking) throw new Error(bErr?.message ?? "Could not create booking");

    return { id: booking.id };
  });

const settingsSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
  deposit_cents: z.number().int().min(0).max(1_000_000),
  buffer_minutes: z.number().int().min(0).max(240),
  cancellation_hours: z.number().int().min(0).max(720),
  whatsapp_business_number: z.string().max(30),
  admin_pin: z.string().regex(/^\d{4}$/),
});

export const updateAdminSettings = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current } = await supabaseAdmin
      .from("settings")
      .select("admin_pin")
      .eq("id", 1)
      .single();
    if (!current || current.admin_pin !== data.pin) {
      throw new Error("Invalid PIN");
    }
    const { error } = await supabaseAdmin
      .from("settings")
      .update({
        deposit_cents: data.deposit_cents,
        buffer_minutes: data.buffer_minutes,
        cancellation_hours: data.cancellation_hours,
        whatsapp_business_number: data.whatsapp_business_number,
        admin_pin: data.admin_pin,
      })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const serviceUpsertSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
  category: z.string().trim().min(1).max(40),
  tier: z.string().trim().max(40).optional().nullable(),
  duration_minutes: z.number().int().min(5).max(600),
  price_cents: z.number().int().min(0).max(10_000_000),
  active: z.boolean(),
});

async function verifyPin(pin: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("settings")
    .select("admin_pin")
    .eq("id", 1)
    .single();
  if (!data || data.admin_pin !== pin) throw new Error("Invalid PIN");
}

export const upsertService = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => serviceUpsertSchema.parse(d))
  .handler(async ({ data }) => {
    await verifyPin(data.pin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      description: data.description || null,
      category: data.category,
      tier: data.tier || null,
      duration_minutes: data.duration_minutes,
      price_cents: data.price_cents,
      active: data.active,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("services").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await supabaseAdmin
      .from("services")
      .insert(payload)
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not add service");
    return { id: created.id };
  });

const serviceDeleteSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
  id: z.string().uuid(),
});

export const deleteService = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => serviceDeleteSchema.parse(d))
  .handler(async ({ data }) => {
    await verifyPin(data.pin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();
    const { count, error: countErr } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("service_id", data.id)
      .gte("start_at", nowIso)
      .in("status", ["confirmed", "completed"]);
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) {
      throw new Error("Babe, this service has future bookings, you can turn it off but not remove it yet 🌸");
    }
    const { error } = await supabaseAdmin.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


