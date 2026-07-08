import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { reorderGallerySets, deleteGallerySet } from "@/lib/gallery.functions";

export const Route = createFileRoute("/admin/gallery/")({
  component: GalleryAdminPage,
});

type GallerySet = {
  id: string;
  title: string;
  category: string;
  image_path: string;
  display_order: number;
  active: boolean;
};

function useSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: ["gallery-signed", paths.join(",")],
    enabled: paths.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("gallery")
        .createSignedUrls(paths, 60 * 60 * 24);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((d, i) => {
        if (d.signedUrl) map[paths[i]] = d.signedUrl;
      });
      return map;
    },
  });
}

function GalleryAdminPage() {
  const qc = useQueryClient();
  const { data: sets = [], isLoading } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_sets")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as GallerySet[];
    },
  });

  const paths = useMemo(() => sets.map((s) => s.image_path), [sets]);
  const { data: urlMap = {} } = useSignedUrls(paths);

  const [reorderMode, setReorderMode] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    setOrder(sets.map((s) => s.id));
  }, [sets]);

  const dragId = useRef<string | null>(null);

  const orderedSets = useMemo(() => {
    const map = new Map(sets.map((s) => [s.id, s]));
    return order.map((id) => map.get(id)).filter(Boolean) as GallerySet[];
  }, [order, sets]);

  const saveOrder = async (next: string[]) => {
    const pin = sessionStorage.getItem("blooming-glitz-pin-value") ?? "";
    if (!/^\d{4}$/.test(pin)) {
      toast("Babe, unlock again to reorder 🌸");
      return;
    }
    try {
      await reorderGallerySets({ data: { pin, order: next } });
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["public-gallery"] });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Uh oh babe, that didn't work 😭 try again");
    }
  };

  const handleDrop = (targetId: string) => {
    if (!dragId.current || dragId.current === targetId) return;
    const from = order.indexOf(dragId.current);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    dragId.current = null;
    saveOrder(next);
  };

  const removeSet = async (id: string) => {
    const pin = sessionStorage.getItem("blooming-glitz-pin-value") ?? "";
    if (!/^\d{4}$/.test(pin)) {
      toast("Babe, unlock again to remove 🌸");
      return;
    }
    if (!confirm("You sure babe? This will delete the photo forever 😭")) return;
    try {
      await deleteGallerySet({ data: { pin, id } });
      toast("Gone babe 🌸");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["public-gallery"] });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Uh oh babe, that didn't work 😭 try again");
    }
  };

  return (
    <main className="min-h-screen pb-28">
      <header className="px-5 pt-6 pb-4 max-w-3xl mx-auto flex items-center justify-between">
        <BrandLogo size={40} showWordmark={false} />
        <Link to="/admin" className="text-sm text-text-soft">
          ← Dashboard
        </Link>
      </header>

      <section className="max-w-2xl mx-auto px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl">My gallery 💅</h1>
            <p className="text-text-soft text-sm mt-1">
              Upload your latest sets babe, show the world what you can do 🌸
            </p>
          </div>
          <Link
            to="/admin/gallery/new"
            className="btn-pill shrink-0 bg-gold text-white hover:bg-gold-deep whitespace-nowrap px-4 py-2 text-sm"
          >
            + Add new set 💅
          </Link>
        </div>

        {isLoading && <div className="mt-8 text-center text-text-soft">One sec babe 🌸</div>}

        {!isLoading && sets.length === 0 && (
          <div className="mt-8 text-center text-text-soft bg-white rounded-2xl p-6">
            No sets yet babe, tap the button above to upload your first one 🌸
          </div>
        )}

        {!isLoading && sets.length > 0 && (
          <>
            <div
              className={`mt-6 grid grid-cols-2 gap-3 ${reorderMode ? "opacity-90" : ""}`}
            >
              {orderedSets.map((s) => (
                <div
                  key={s.id}
                  draggable={reorderMode}
                  onDragStart={() => (dragId.current = s.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(s.id)}
                  className={`relative bg-white rounded-2xl overflow-hidden shadow-sm ${
                    reorderMode ? "ring-2 ring-gold/60 cursor-grab active:cursor-grabbing" : ""
                  } ${s.active ? "" : "opacity-60"}`}
                >
                  <div className="aspect-square bg-cream-soft">
                    {urlMap[s.image_path] ? (
                      <img
                        src={urlMap[s.image_path]}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setReorderMode((v) => !v)}
                    className="absolute top-2 right-2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-text-soft shadow"
                    aria-label="Reorder"
                  >
                    ⋮⋮
                  </button>
                  <div className="p-3">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-[11px] text-text-soft mt-0.5">{s.category}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <Link
                        to="/admin/gallery/$id"
                        params={{ id: s.id }}
                        className="text-gold-deep"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => removeSet(s.id)}
                        className="text-wine"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reorderMode && (
              <div className="fixed bottom-4 inset-x-0 flex justify-center z-20">
                <button
                  onClick={() => setReorderMode(false)}
                  className="btn-pill bg-gold text-white hover:bg-gold-deep px-6 py-3 shadow-lg"
                >
                  Done reordering 🌸
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
