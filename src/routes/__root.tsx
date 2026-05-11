import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl text-earth/20">404</h1>
        <h2 className="mt-4 font-serif text-2xl italic text-earth">This page is elsewhere.</h2>
        <p className="mt-2 text-sm text-earth/60">Maybe it was a memory you haven't written yet.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-earth px-6 py-2 text-xs uppercase tracking-widest text-parchment hover:bg-earth/90 transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl text-earth">Something paused.</h1>
        <p className="mt-2 text-sm text-earth/60">{error.message}</p>
        <div className="mt-6">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-earth px-6 py-2 text-xs uppercase tracking-widest text-parchment hover:bg-earth/90 transition-colors"
          >
            Try again
          </button>
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
      { title: "Twofold — A private home for two" },
      { name: "description", content: "A closed, private digital home for long-distance couples. Shared diary, moods, and memories." },
      { property: "og:title", content: "Twofold — A private home for two" },
      { name: "twitter:title", content: "Twofold — A private home for two" },
      { property: "og:description", content: "A closed, private digital home for long-distance couples. Shared diary, moods, and memories." },
      { name: "twitter:description", content: "A closed, private digital home for long-distance couples. Shared diary, moods, and memories." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c0439f94-07c1-4cae-871c-3b08090608a5/id-preview-8905dd3f--da26db38-8d24-47fe-8cb9-8ec499d61648.lovable.app-1778521841483.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c0439f94-07c1-4cae-871c-3b08090608a5/id-preview-8905dd3f--da26db38-8d24-47fe-8cb9-8ec499d61648.lovable.app-1778521841483.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
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
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
