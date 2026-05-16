import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { OriginalClientApp } from "@/original/ClientApp";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return <OriginalClientApp />;
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
      <OriginalClientApp />
    </QueryClientProvider>
  );
}
