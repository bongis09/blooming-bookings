import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { upsertGallerySet } from "@/lib/gallery.functions";

export const Route = createFileRoute("/admin/gallery/new")({
  component: NewGalleryPage,
  head: () => ({
    meta: [
      { title: "Add a set — Blooming GLITZ 💅" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

export const CATEGORIES = [
  "Nails 💅",
  "Toes 🦶",
  "French Tips 🇫🇷",
  "Gold & Glitter ✨",
  "3D Art 🌸",
  "Chrome 💎",
  "Other 🎀",
];

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

function NewGalleryPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickFile = async (f: File | null) => {
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
    const pin = sessionStorage.getItem("blooming-glitz-pin-value") ?? "";
    if (!/^\d{4}$/.test(pin)) {
      toast("Babe, unlock again to upload 🌸");
      return;
    }
    if (!file) {
      toast("Babe, pick a photo first 🌸");
      return;
    }
    if (!title.trim()) {
      toast("Give it a name babe 💗");
      return;
    }
    setSaving(true);
    toast("Uploading babe, one sec 🌸");
    try {
      const dataUrl = await fileToBase64(file);
      await upsertGallerySet({
        data: {
          pin,
          title: title.trim(),
          category,
          active: true,
          imageBase64: dataUrl,
          imageMime: file.type,
        },
      });
      toast("Added babe 💗");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["public-gallery"] });
      nav({ to: "/admin/gallery" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Uh oh babe, that didn't work 😭 try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen pb-24">
      <header className="px-5 pt-6 pb-4 max-w-2xl mx-auto flex items-center justify-between">
        <BrandLogo size={40} showWordmark={false} />
        <Link to="/admin/gallery" className="text-sm text-text-soft">
          ← Gallery
        </Link>
      </header>

      <section className="max-w-md mx-auto px-5">
        <h1 className="font-heading text-3xl">Add a set 💅</h1>

        <label className="mt-6 block">
          <div className="aspect-square rounded-2xl border-2 border-dashed border-gold/60 bg-white flex flex-col items-center justify-center text-text-soft overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="text-3xl">📸</div>
                <div className="mt-2 text-sm">Tap to pick a photo 📸</div>
                <div className="text-xs mt-1">or Take a new photo</div>
              </>
            )}
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

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="btn-pill w-full flex bg-gold text-white hover:bg-gold-deep disabled:opacity-60"
          >
            {saving ? "Uploading babe, one sec 🌸" : "Upload set 💗"}
          </button>
          <Link
            to="/admin/gallery"
            className="text-center text-sm text-text-soft"
          >
            Cancel
          </Link>
        </div>
      </section>
    </main>
  );
}
