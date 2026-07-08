import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function verifyPin(pin: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("settings")
    .select("admin_pin")
    .eq("id", 1)
    .single();
  if (!data || data.admin_pin !== pin) throw new Error("Invalid PIN");
}

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BYTES = 10 * 1024 * 1024;

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/heic" || mime === "image/heif") return "heic";
  return "jpg";
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const upsertSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
  id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(40),
  active: z.boolean().default(true),
  // New/replacement image (optional on edit)
  imageBase64: z.string().optional().nullable(),
  imageMime: z.string().optional().nullable(),
});

export const upsertGallerySet = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data }) => {
    await verifyPin(data.pin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let newPath: string | null = null;
    let oldPath: string | null = null;

    if (data.imageBase64 && data.imageMime) {
      if (!ALLOWED_MIME.includes(data.imageMime.toLowerCase())) {
        throw new Error("Uh oh babe, that's not a photo I can use 😭 try a jpg or png");
      }
      const bytes = base64ToBytes(data.imageBase64);
      if (bytes.byteLength > MAX_BYTES) {
        throw new Error("Babe that photo's too big 😭 max 10MB");
      }
      const ext = extFromMime(data.imageMime.toLowerCase());
      newPath = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("gallery")
        .upload(newPath, bytes, { contentType: data.imageMime, upsert: false });
      if (upErr) throw new Error(upErr.message);
    }

    if (data.id) {
      // Fetch old to know previous image_path
      const { data: existing } = await supabaseAdmin
        .from("gallery_sets")
        .select("image_path")
        .eq("id", data.id)
        .single();
      oldPath = existing?.image_path ?? null;

      const patch: Record<string, unknown> = {
        title: data.title,
        category: data.category,
        active: data.active,
      };
      if (newPath) patch.image_path = newPath;

      const { error } = await supabaseAdmin
        .from("gallery_sets")
        .update(patch)
        .eq("id", data.id);
      if (error) throw new Error(error.message);

      if (newPath && oldPath && oldPath !== newPath) {
        await supabaseAdmin.storage.from("gallery").remove([oldPath]);
      }
      return { id: data.id };
    }

    if (!newPath) throw new Error("Babe, pick a photo first 🌸");

    // Determine next display_order
    const { data: maxRow } = await supabaseAdmin
      .from("gallery_sets")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (maxRow?.display_order ?? -1) + 1;

    const { data: created, error } = await supabaseAdmin
      .from("gallery_sets")
      .insert({
        title: data.title,
        category: data.category,
        image_path: newPath,
        active: data.active,
        display_order: nextOrder,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not save set");
    return { id: created.id };
  });

const deleteSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
  id: z.string().uuid(),
});

export const deleteGallerySet = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data }) => {
    await verifyPin(data.pin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("gallery_sets")
      .select("image_path")
      .eq("id", data.id)
      .single();

    const { error } = await supabaseAdmin
      .from("gallery_sets")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (existing?.image_path) {
      await supabaseAdmin.storage.from("gallery").remove([existing.image_path]);
    }
    return { ok: true };
  });

const reorderSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
  order: z.array(z.string().uuid()).min(1).max(500),
});

export const reorderGallerySets = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => reorderSchema.parse(d))
  .handler(async ({ data }) => {
    await verifyPin(data.pin);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < data.order.length; i++) {
      const { error } = await supabaseAdmin
        .from("gallery_sets")
        .update({ display_order: i })
        .eq("id", data.order[i]);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
