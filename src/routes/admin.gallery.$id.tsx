import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { upsertGallerySet, deleteGallerySet } from "@/lib/gallery.functions";
import { CATEGORIES } from "./admin.gallery.new";

export const Route = createFileRoute("/admin/gallery/$id")({
  component: EditGalleryPage,
  head: () => ({
    meta: [
      { title: "Edit set — Blooming GLITZ 💅" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BYTES = 10 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function EditGalleryPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: set, isLoading } = useQuery({
    queryKey: ["admin-gallery-set", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_sets")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: signedUrl } = useQuery({
    queryKey: ["admin-gallery-set-url", set?.image_path],
    enabled: !!set?.image_path,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("gallery")
        .createSignedUrl(set!.image_path, 60 * 60 * 24);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (set) {
      setTitle(set.title);
      setCategory(set.category);
      setActive(set.active);
    }
  }, [set]);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type.toLowerCase())) {
      toast("Uh oh babe, use a jpg, png, webp or heic 🌸");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast("Babe that photo's too big 😭 max 10MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    const pin = settings?.admin_pin ?? "";
    if (!/^\d{4}$/.test(pin)) {
      toast("Babe, unlock again to save 🌸");
      return;
    }
    if (!title.trim()) {
      toast("Give it a name babe 💗");
      return;
    }
    setSaving(true);
    try {
      let imageBase64: string | null = null;
      let imageMime: string | null = null;
      if (file) {
        toast("Uploading babe, one sec 🌸");
        imageBase64 = await fileToBase64(file);
        imageMime = file.type;
      }
      await upsertGallerySet({
        data: {
          pin,
          id,
          title: title.trim(),
          category,
          active,
          imageBase64,
          imageMime,
        },
      });
      toast("Saved babe 💗");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["public-gallery"] });
      nav({ to: "/admin/gallery" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Uh oh babe, that didn't work 😭 try again");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const pin = settings?.admin_pin ?? "";
    if (!/^\d{4}$/.test(pin)) {
      toast("Babe, unlock again to remove 🌸");
      return;
    }
    try {
      await deleteGallerySet({ data: { pin, id } });
      toast("Gone babe 🌸");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["public-gallery"] });
      nav({ to: "/admin/gallery" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Uh oh babe, that didn't work 😭 try again");
    }
  };

  if (isLoading) {
    return <main className="min-h-screen flex items-center justify-center text-text-soft">One sec babe 🌸</main>;
  }

  return (
    <main className="min-h-screen pb-24">
      <header className="px-5 pt-6 pb-4 max-w-2xl mx-auto flex items-center justify-between">
        <BrandLogo size={40} showWordmark={false} />
        <Link to="/admin/gallery" className="text-sm text-text-soft">
          ← Gallery
        </Link>
      </header>

      <section className="max-w-md mx-auto px-5">
        <h1 className="font-heading text-3xl">Edit set 💅</h1>

        <div className="mt-6 aspect-square rounded-2xl overflow-hidden bg-white">
          {preview ? (
            <img src={preview} alt="New preview" className="w-full h-full object-cover" />
          ) : signedUrl ? (
            <img src={signedUrl} alt={set?.title ?? ""} className="w-full h-full object-cover" />
          ) : null}
        </div>

        <label className="mt-3 block">
          <div className="btn-pill w-full flex bg-white border border-gold text-gold-deep text-center">
            Replace image 📸
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="mt-5">
          <label className="text-sm text-text-soft">
            What do you want to call this set, babe?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Gold French Tips on Pink 💗"
            className="mt-1 w-full bg-white rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-gold"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-text-soft">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full bg-white rounded-xl border border-border px-4 py-3 focus:outline-none focus:border-gold"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Show on public gallery
        </label>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="btn-pill w-full flex bg-gold text-white hover:bg-gold-deep disabled:opacity-60"
          >
            {saving ? "Uploading babe, one sec 🌸" : "Save changes 💗"}
          </button>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="btn-pill w-full flex bg-wine text-white hover:opacity-90"
            >
              Remove this set
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-4 text-center">
              <div className="text-sm">You sure babe? This will delete the photo forever 😭</div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={remove}
                  className="btn-pill flex-1 flex bg-wine text-white"
                >
                  Yes, remove
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="btn-pill flex-1 flex bg-cream-soft text-text-dark"
                >
                  No, keep it
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
