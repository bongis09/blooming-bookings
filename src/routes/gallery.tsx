import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/gallery")({
  component: PublicGalleryPage,
  head: () => ({
    meta: [
      { title: "Gallery — Blooming GLITZ 💅" },
      {
        name: "description",
        content: "Take a look at Lerato's latest nail sets — book yours babe 💗",
      },
      { property: "og:title", content: "Gallery — Blooming GLITZ 💅" },
      {
        property: "og:description",
        content: "Take a look at Lerato's latest nail sets — book yours babe 💗",
      },
    ],
  }),
});

type GallerySet = {
  id: string;
  title: string;
  category: string;
  image_path: string;
};

function PublicGalleryPage() {
  const { data: sets = [], isLoading } = useQuery({
    queryKey: ["public-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_sets")
        .select("id, title, category, image_path")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return data as GallerySet[];
    },
  });

  const paths = useMemo(() => sets.map((s) => s.image_path), [sets]);
  const { data: urlMap = {} } = useQuery({
    queryKey: ["public-gallery-urls", paths.join(",")],
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

  return (
    <main className="min-h-screen pb-16">
      <header className="px-5 pt-6 pb-4 max-w-3xl mx-auto flex items-center justify-between">
        <BrandLogo size={44} showWordmark={false} />
        <Link to="/book" className="text-sm text-gold-deep">
          Book yours 💗
        </Link>
      </header>

      <section className="max-w-3xl mx-auto px-5">
        <h1 className="font-heading text-3xl">The gallery 💅</h1>
        <p className="text-text-soft text-sm mt-1">
          Latest sets from Lerato — tap one you love and book yours 🌸
        </p>

        {isLoading && <div className="mt-8 text-center text-text-soft">One sec babe 🌸</div>}

        {!isLoading && sets.length === 0 && (
          <div className="mt-8 text-center text-text-soft bg-white rounded-2xl p-6">
            New sets dropping soon babe 🌸
          </div>
        )}

        {sets.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sets.map((s) => (
              <figure
                key={s.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="aspect-square bg-cream-soft">
                  {urlMap[s.image_path] && (
                    <img
                      src={urlMap[s.image_path]}
                      alt={s.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <figcaption className="p-3">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-[11px] text-text-soft mt-0.5">{s.category}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
