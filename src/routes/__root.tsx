import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-6xl text-gold">Oops babe</p>
        <h2 className="mt-2 text-xl font-heading text-text-dark">Can't find that page 🌸</h2>
        <p className="mt-2 text-sm text-text-soft">
          The page you're after doesn't exist, or I moved it. Let's get you home.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-pill bg-gold text-white hover:bg-gold-deep">
            Take me home 💗
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-heading text-text-dark">
          Uh oh babe, something went wrong 😭
        </h1>
        <p className="mt-2 text-sm text-text-soft">
          Try again, if it keeps happening just WhatsApp me 💗
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-pill bg-gold text-white hover:bg-gold-deep"
          >
            Try again 🌸
          </button>
          <a href="/" className="btn-pill border border-gold bg-white text-gold-deep">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#c9a961" },
      { title: "Blooming GLITZ — Nails at Toti Mall 💅" },
      {
        name: "description",
        content:
          "Book your nails with Lerato at Blooming GLITZ, Toti Mall, Amanzimtoti. Pick a slot, pay a small deposit, you're in 🌸",
      },
      { name: "author", content: "Blooming GLITZ" },
      { property: "og:title", content: "Blooming GLITZ — Let me doll you up 💗" },
      {
        property: "og:description",
        content:
          "Book your nails with Lerato at Blooming GLITZ, Toti Mall, Amanzimtoti.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,500;1,500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#2a1f1a",
            border: "1px solid #c9a961",
            borderRadius: "9999px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
