import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n/context";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold md:text-3xl">{t.about.title}</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">{t.about.body}</p>
      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        <li>• {t.about.data}</li>
        <li>• {t.about.built}</li>
      </ul>
    </div>
  );
}
