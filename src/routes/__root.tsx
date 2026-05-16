import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Bot, BookOpen, Compass, Menu } from "lucide-react";
import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n/context";
import { GameFilterProvider } from "@/lib/gameFilter";
import { Header } from "@/components/Header";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">Page not found</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Home
        </Link>
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
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "دليل البوكيدكس | Pokédex Guide" },
      {
        name: "description",
        content: "دليل بوكيدكس عربي لألعاب سويتش مع البحث والفلاتر والتقدم والمفضلة.",
      },
      { property: "og:title", content: "دليل البوكيدكس | Pokédex Guide" },
      { name: "twitter:title", content: "دليل البوكيدكس | Pokédex Guide" },
      {
        property: "og:description",
        content: "دليل بوكيدكس عربي لألعاب سويتش مع البحث والفلاتر والتقدم والمفضلة.",
      },
      {
        name: "twitter:description",
        content: "دليل بوكيدكس عربي لألعاب سويتش مع البحث والفلاتر والتقدم والمفضلة.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bc202b9e-211d-480a-a1b7-65b9afa17921/id-preview-f6fab27b--7496b19a-5405-4922-9012-d23f1ac38150.lovable.app-1778904188971.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bc202b9e-211d-480a-a1b7-65b9afa17921/id-preview-f6fab27b--7496b19a-5405-4922-9012-d23f1ac38150.lovable.app-1778904188971.png",
      },
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
    <html lang="ar" dir="rtl">
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
      <I18nProvider>
        <GameFilterProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 pb-28 md:pb-8">
              <Outlet />
            </main>
            <BottomNav />
          </div>
        </GameFilterProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

function BottomNav() {
  const items = [
    { to: "/", label: "الدليل", icon: BookOpen, exact: true },
    { to: "/types", label: "الاستكشاف", icon: Compass },
    { to: "/items", label: "المدرب", icon: Bot },
    { to: "/about", label: "المزيد", icon: Menu },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pb-4 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-bold text-muted-foreground"
              activeProps={{ className: "bg-primary/10 text-primary" }}
            >
              <Icon className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
