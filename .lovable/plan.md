## نظرة عامة

تطبيق Pokédex كامل بالعربية (افتراضياً RTL) مع تبديل للإنجليزية، يعتمد على PokéAPI كمصدر للبيانات، ويخزّنها في Lovable Cloud (Postgres) مع كاش Offline في IndexedDB.

## الميزات (المرحلة الأولى)

1. **Pokédex** — شبكة بطاقات بأول 386 بوكيمون (الأجيال 1–3)، بحث حي، فلترة حسب النوع والجيل، ترقيم/تمرير لانهائي.
2. **صفحة التفاصيل** — صورة، رقم، أنواع، وصف بالعربية/الإنجليزية، إحصائيات (HP/Attack/Defense/...) كأشرطة، الطول/الوزن، القدرات.
3. **سلسلة التطور** — شجرة مع دعم التفرع (Eevee مثلاً)، شرط التطور (مستوى/حجر/سعادة).
4. **جدول فعالية الأنواع** — حساب الضعف والمقاومة (×0, ×0.25, ×0.5, ×1, ×2, ×4) لأي بوكيمون أو نوع.
5. **i18n عربي/إنجليزي + RTL** — العربية افتراضية، زر تبديل في الهيدر، أسماء البوكيمون والأوصاف من PokéAPI متعدد اللغات.
6. **Offline** — IndexedDB كاش أول، Service Worker لتخزين الصور والـ assets، شارة "Offline" عند انقطاع الشبكة.

## المعمارية التقنية

### Backend (Lovable Cloud)
جداول:
- `pokemon` — id, name_en, name_ar, types (text[]), generation, height, weight, sprite_url, official_artwork_url, stats (jsonb), abilities (jsonb), description_en, description_ar
- `evolution_nodes` — id, pokemon_id, evolves_to_id, trigger, condition (jsonb)
- `types_meta` — name, color, ar_name (للألوان والترجمة)

سياسة RLS: قراءة عامة (`SELECT` للجميع)، الكتابة محصورة بـ service role.

### Sync Job
Server function (`/api/public/sync-pokemon`) تسحب من PokéAPI وتعبّئ Cloud عند أول تشغيل (حتى 386). يعمل دفعة دفعة (50 لكل استدعاء) لتجنب timeout.

### Frontend
- TanStack Router routes:
  - `/` — Pokédex (شبكة + بحث + فلترة، params في URL)
  - `/pokemon/$id` — تفاصيل + سلسلة التطور + فعالية الأنواع
  - `/types` — جدول الأنواع التفاعلي
  - `/about` — عن التطبيق
- TanStack Query للبيانات + IndexedDB (`idb` package) كطبقة كاش.
- ContextProvider للغة + `dir="rtl"` ديناميكي على `<html>`.
- Tailwind tokens مخصصة لألوان الأنواع الـ18 في `styles.css`.

### Offline
- `src/lib/db.ts` — IndexedDB wrapper (stores: pokemon, evolutions, types).
- استراتيجية: cache-first، fallback إلى Cloud، تحديث الكاش بالخلفية.
- Service Worker بسيط للصور (cache-first بحد 1000 صورة).

## بنية الملفات

```
src/
├── routes/
│   ├── __root.tsx          (Header + LanguageProvider + Outlet)
│   ├── index.tsx           (Pokédex)
│   ├── pokemon.$id.tsx     (تفاصيل)
│   ├── types.tsx           (جدول الأنواع)
│   ├── about.tsx
│   └── api/public/
│       └── sync-pokemon.ts
├── lib/
│   ├── pokemon.functions.ts    (server fns: list, getById, search)
│   ├── db.ts                   (IndexedDB)
│   ├── typeChart.ts            (فعالية الأنواع)
│   ├── evolution/
│   │   ├── normalize.ts
│   │   └── stageLayout.ts
│   └── i18n/
│       ├── context.tsx
│       ├── ui.ar.json
│       └── ui.en.json
├── components/
│   ├── Header.tsx              (تبديل اللغة + بحث)
│   ├── PokemonCard.tsx
│   ├── PokemonGrid.tsx
│   ├── TypeBadge.tsx
│   ├── StatsBar.tsx
│   ├── EvolutionChain.tsx
│   ├── TypeEffectiveness.tsx
│   └── OfflineIndicator.tsx
└── styles.css                  (tokens + ألوان الأنواع + RTL utilities)
```

## خطوات التنفيذ

1. تفعيل **Lovable Cloud** وإنشاء جداول (`pokemon`, `evolution_nodes`, `types_meta`) مع RLS.
2. كتابة **server function للمزامنة** من PokéAPI (دفعات).
3. بناء **i18n context** + ملفات الترجمة + RTL.
4. **styles.css**: tokens لألوان الأنواع الـ18، خط عربي (Cairo/Tajawal).
5. **مكونات أساسية**: Header، PokemonCard، TypeBadge، StatsBar.
6. **Pokédex** (`/`) مع بحث/فلترة + IndexedDB cache-first.
7. **صفحة التفاصيل** (`/pokemon/$id`) + EvolutionChain + TypeEffectiveness.
8. **typeChart.ts** + صفحة `/types`.
9. **Service Worker** للصور (محمي ضد iframe preview).
10. تشغيل المزامنة الأولية وتعبئة قاعدة البيانات.
11. صقل الواجهة (سكلتون، انتقالات، شارة offline).

## ملاحظات

- لن أبني الاختبارات (Vitest) في هذه المرحلة لتقليص الحجم — يمكن إضافتها لاحقاً.
- Service Worker سيكون disabled في معاينة Lovable (iframe) ويعمل في النشر فقط.
- المزامنة من PokéAPI تستغرق دقيقتين تقريباً عند أول تشغيل (تظهر شاشة تحميل واضحة).
- الخط العربي: Tajawal من Google Fonts.
- لن أبني صفحة admin يدوية — البيانات تأتي من PokéAPI تلقائياً.