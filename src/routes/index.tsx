import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/")({
  component: Home,
});

const tiers = [
  { title: "Try Me ✨", sub: "soak-off + fresh gel" },
  { title: "The Regular 💖", sub: "acrylic tips, polygel, gel overlay" },
  { title: "Full Bloom 🌸", sub: "hands + toes, the whole package" },
  { title: "VIP 💎", sub: "year-ahead, priority slots" },
];

function Home() {
  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between max-w-5xl mx-auto">
        <BrandLogo size={54} />
        <Link
          to="/admin"
          className="text-xs text-text-soft hover:text-gold-deep transition-colors"
        >
          Lerato →
        </Link>
      </header>

      {/* Hero */}
      <section className="bg-fur pb-14 pt-6 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <p className="uppercase tracking-[0.25em] text-xs text-gold-deep">
            Toti Mall · Amanzimtoti
          </p>
          <h1 className="font-display text-6xl sm:text-7xl text-gold-deep mt-4 leading-none">
            Hey huns🌸,
            <br />
            I'm Lerato
          </h1>
          <p className="font-heading text-2xl text-text-dark mt-6">
            Let me doll you up 💗
          </p>
          <p className="text-text-soft mt-3 max-w-md mx-auto">
            I do nails that make you feel like the main character ✨
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/book"
              className="btn-pill bg-gold text-white shadow-lg shadow-gold/25 hover:bg-gold-deep active:scale-95"
            >
              Book your glow 💅
            </Link>
            <Link
              to="/services"
              className="btn-pill border border-gold bg-white/70 text-gold-deep hover:bg-white"
            >
              See my work
            </Link>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="px-5 py-16 max-w-2xl mx-auto">
        <h2 className="font-heading text-3xl text-text-dark">Why I do what I do</h2>
        <div className="mt-6 space-y-4 text-text-dark leading-relaxed">
          <p>
            I'm Lerato, and I do nails at Toti Mall, every day except Sunday and Monday. I
            love it, honestly. I love sitting with someone, talking about life, and
            walking out with hands that look brand new 💗
          </p>
          <p>
            The reason I built this app is cause I kept losing the book. You know how it
            is — someone books on WhatsApp, someone calls, I write it down, and then I
            forget, and then I double book 😭
          </p>
          <p>So no more. Now you book here, I see you, you see me, no stress babe 🌸</p>
        </div>

        <blockquote className="mt-8 border-l-4 border-gold pl-5 py-2 font-accent italic text-lg text-wine">
          "Cause she doesn't have a booking system"
          <span className="block not-italic text-xs text-text-soft mt-1 font-body">
            — the real reason this app exists
          </span>
        </blockquote>
      </section>

      {/* Services teaser */}
      <section className="px-5 py-12 bg-cream-soft">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl text-text-dark text-center">
            Pick your vibe 💅
          </h2>
          <p className="text-text-soft text-center mt-2">
            Tap the one that's speaking to you
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tiers.map((t) => (
              <Link
                key={t.title}
                to="/services"
                className="bg-white rounded-2xl p-5 border border-transparent hover:border-gold transition-all active:scale-[0.98] shadow-sm"
              >
                <div className="font-heading text-xl text-text-dark">{t.title}</div>
                <div className="text-sm text-text-soft mt-1">{t.sub}</div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/services"
              className="btn-pill bg-white border border-gold text-gold-deep hover:bg-gold hover:text-white"
            >
              See all services
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-5 py-10">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-around gap-3 text-center text-sm text-text-dark">
          <div>📍 Toti Mall, Amanzimtoti</div>
          <div>🕗 Tue–Sat · 08:30–16:30</div>
          <div>💗 @leratolanga866</div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-5 pb-16">
        <div className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-br from-wine to-rose-deep text-white p-8 sm:p-10 text-center shadow-xl">
          <h2 className="font-display text-5xl">Ready to book, babe? 💅</h2>
          <p className="mt-3 opacity-90">Pick a slot, pay a small deposit, you're in 🌸</p>
          <Link
            to="/book"
            className="btn-pill bg-white text-wine mt-6 hover:bg-cream active:scale-95"
          >
            Book now ✨
          </Link>
        </div>
      </section>

      <footer className="text-center text-xs text-text-soft py-6">
        Blooming GLITZ · Made with 💗
      </footer>
    </main>
  );
}
